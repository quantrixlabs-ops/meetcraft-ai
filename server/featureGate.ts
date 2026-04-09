import { supabaseAdmin } from './lib/supabase';

export type FeatureType = 'project' | 'video' | 'podcast' | 'voice' | 'advanced_mode';

interface TierConfig {
  projectLimit: number;
  videoLimit: number;
  podcastLimit: number;
  voiceMinutesLimit: number;
  allowedModes: string[];
}

const TIERS: Record<string, TierConfig> = {
  free: {
    projectLimit: 3,
    videoLimit: 0,
    podcastLimit: 0,
    voiceMinutesLimit: 0,
    allowedModes: ['Standard']
  },
  pro: {
    projectLimit: 50,
    videoLimit: 10,
    podcastLimit: 20,
    voiceMinutesLimit: 60,
    allowedModes: ['Standard', 'Executive', 'Academic', 'Debate']
  },
  enterprise: {
    projectLimit: 9999,
    videoLimit: 100,
    podcastLimit: 100,
    voiceMinutesLimit: 9999,
    allowedModes: ['Standard', 'Executive', 'Academic', 'Debate']
  }
};

class FeatureGate {
  
  public async getUserTier(userId: string): Promise<string> {
    if (userId === 'anon' || userId.includes('local')) return 'free'; // Default for local dev
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();

    if (error || !data) return 'free';
    return data.plan || 'free';
  }

  public async checkAccess(userId: string, feature: FeatureType): Promise<boolean> {
    const tier = await this.getUserTier(userId);
    const config = TIERS[tier];

    // Mock usage check (In real system, count rows in usage_logs or specific tables)
    // For Phase 4 MVP, we enforce binary access for premium features
    
    if (feature === 'video' && config.videoLimit === 0) throw new Error(`Upgrade to Pro to generate videos.`);
    if (feature === 'podcast' && config.podcastLimit === 0) throw new Error(`Upgrade to Pro to generate podcasts.`);
    if (feature === 'voice' && config.voiceMinutesLimit === 0) throw new Error(`Upgrade to Pro to use Voice Tutor.`);
    
    return true;
  }

  public async getQuota(userId: string) {
    const tier = await this.getUserTier(userId);
    const config = TIERS[tier];
    
    // In a real implementation, we would aggregate counts from the DB
    return {
      tier,
      limits: config,
      // Mocks
      usage: {
        projects: 0,
        video: 0,
        podcast: 0
      }
    };
  }
}

export const featureGate = new FeatureGate();