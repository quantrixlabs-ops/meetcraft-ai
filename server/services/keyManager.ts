import { supabaseAdmin } from '../lib/supabase';
import { cryptoUtils } from '../utils/crypto';
import { ApiKey } from '../../types';
import { detectProvider } from '../utils/providerDetector';

class KeyManager {
  private localKeys: Map<string, any[]> = new Map(); // Fallback for local dev

  public async saveKey(userId: string, provider: string, key: string, label: string): Promise<ApiKey> {
    const encrypted = cryptoUtils.encrypt(key);
    const mask = key.slice(-4);
    // Auto-detect provider from key prefix when caller passes 'auto' or empty string
    const resolvedProvider = (!provider || provider === 'auto') ? detectProvider(key) : provider;
    console.log(`[KeyManager] Saving key for provider: ${resolvedProvider} (requested: ${provider || 'auto'})`);
    provider = resolvedProvider;
    
    // Local Mode Fallback
    if (userId.includes('local') || userId === 'anon') {
        const newKey = {
            id: 'local-key-' + Date.now(),
            user_id: userId,
            provider,
            key_ciphertext: encrypted,
            key_mask: mask,
            label,
            is_active: true,
            created_at: new Date().toISOString()
        };
        const userKeys = this.localKeys.get(userId) || [];
        // Deactivate others of same provider for simplicity in MVP
        userKeys.forEach(k => { if(k.provider === provider) k.is_active = false; });
        userKeys.push(newKey);
        this.localKeys.set(userId, userKeys);
        
        return {
            id: newKey.id,
            provider: newKey.provider as any,
            keyMask: newKey.key_mask,
            label: newKey.label,
            isActive: newKey.is_active,
            createdAt: newKey.created_at
        };
    }

    // Supabase Mode
    // 1. Deactivate existing keys for this provider (Single active key policy for MVP)
    await supabaseAdmin
      .from('api_keys')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('provider', provider);

    // 2. Insert new key
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        user_id: userId,
        provider,
        key_ciphertext: encrypted,
        key_mask: mask,
        label,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      provider: data.provider,
      keyMask: data.key_mask,
      label: data.label,
      isActive: data.is_active,
      createdAt: data.created_at
    };
  }

  public async getActiveKey(userId: string, provider: string): Promise<string | null> {
    if (userId.includes('local') || userId === 'anon') {
       const keys = this.localKeys.get(userId) || [];
       const active = keys.find(k => k.provider === provider && k.is_active);
       return active ? cryptoUtils.decrypt(active.key_ciphertext) : null;
    }

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('key_ciphertext')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    try {
      return cryptoUtils.decrypt(data.key_ciphertext);
    } catch (e) {
      console.error("Failed to decrypt key", e);
      return null;
    }
  }

  public async listKeys(userId: string): Promise<ApiKey[]> {
    if (userId.includes('local') || userId === 'anon') {
        return (this.localKeys.get(userId) || []).map(k => ({
            id: k.id,
            provider: k.provider,
            keyMask: k.key_mask,
            label: k.label,
            isActive: k.is_active,
            createdAt: k.created_at
        }));
    }

    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((k: any) => ({
      id: k.id,
      provider: k.provider,
      keyMask: k.key_mask,
      label: k.label,
      isActive: k.is_active,
      createdAt: k.created_at
    }));
  }

  public async deleteKey(userId: string, keyId: string): Promise<void> {
    if (userId.includes('local') || userId === 'anon') {
        const keys = this.localKeys.get(userId) || [];
        this.localKeys.set(userId, keys.filter(k => k.id !== keyId));
        return;
    }

    await supabaseAdmin
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId);
  }
}

export const keyManager = new KeyManager();