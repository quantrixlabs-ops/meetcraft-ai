import { supabase, isSupabaseConfigured } from './supabaseClient';
import { KnowledgePackage } from '../types';

class StorageService {
  
  // --- CLOUD METHODS ---

  private async savePackageCloud(data: KnowledgePackage): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: data.meta.topic,
        industry: data.meta.industry,
        meta: data.meta,
        overview: data.overview,
        agenda: data.agenda,
        slides: data.slides,
        takeaways: data.takeaways,
        book_chapters: data.bookChapters,
        sources: data.sources
      })
      .select('id')
      .single();

    if (error) throw error;
    return project.id;
  }

  // --- LOCAL METHODS ---
  private getLocalHistory(): any[] {
    try {
      return JSON.parse(localStorage.getItem('kp_history') || '[]');
    } catch {
      return [];
    }
  }

  private saveLocal(data: KnowledgePackage): string {
    const history = this.getLocalHistory();
    const id = crypto.randomUUID();
    const record = { 
      ...data, 
      id, 
      createdAt: Date.now() 
    };
    // Add to top
    history.unshift(record);
    localStorage.setItem('kp_history', JSON.stringify(history));
    return id;
  }

  // --- PUBLIC INTERFACE ---

  async savePackage(data: KnowledgePackage): Promise<string> {
    if (isSupabaseConfigured) {
      return this.savePackageCloud(data);
    } else {
      return this.saveLocal(data);
    }
  }

  async updatePackage(id: string, data: KnowledgePackage): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('projects')
        .update({
          title: data.meta.topic,
          meta: data.meta,
          overview: data.overview,
          agenda: data.agenda,
          slides: data.slides,
          takeaways: data.takeaways,
          book_chapters: data.bookChapters,
          sources: data.sources,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    } else {
       const history = this.getLocalHistory();
       const idx = history.findIndex(p => p.id === id);
       if (idx !== -1) {
         history[idx] = { ...data, id, createdAt: history[idx].createdAt };
         localStorage.setItem('kp_history', JSON.stringify(history));
       }
    }
  }

  async getPackage(id: string): Promise<(KnowledgePackage & { id: string, createdAt: number }) | undefined> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;

      return {
        id: data.id,
        meta: data.meta,
        overview: data.overview,
        agenda: data.agenda,
        slides: data.slides,
        takeaways: data.takeaways,
        bookChapters: data.book_chapters,
        sources: data.sources,
        createdAt: new Date(data.created_at).getTime()
      };
    } else {
      const history = this.getLocalHistory();
      return history.find(p => p.id === id);
    }
  }

  async getAllPackages(): Promise<(KnowledgePackage & { id: string, createdAt: number })[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Failed to fetch projects", error);
        return [];
      }

      return data.map((d: any) => ({
        id: d.id,
        meta: d.meta,
        overview: d.overview,
        agenda: d.agenda,
        slides: d.slides,
        takeaways: d.takeaways,
        bookChapters: d.book_chapters,
        sources: d.sources,
        createdAt: new Date(d.created_at).getTime()
      }));
    } else {
      return this.getLocalHistory();
    }
  }

  async deletePackage(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      const history = this.getLocalHistory().filter(p => p.id !== id);
      localStorage.setItem('kp_history', JSON.stringify(history));
    }
  }

  async migrateFromLocalStorage() {
     // No-op for now
  }
}

export const storageService = new StorageService();