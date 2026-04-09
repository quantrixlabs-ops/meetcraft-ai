import { SupabaseClient } from '@supabase/supabase-js';

// Always return false to force local mode
export const isSupabaseConfigured = false;

console.log("⚠️ App running in Local/Offline Mode (Supabase disabled).");

// Fully mocked client that returns safe "success" or "null" responses
// to prevent any UI crashes in the frontend components.
const localMockClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: { id: 'local-user' } }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: async () => ({ data: { user: null }, error: null }),
  },
  from: () => ({
      select: () => ({ 
        eq: () => ({ 
          single: async () => ({ data: null, error: null }),
          order: () => ({ data: [], error: null }) // Returns empty array for lists
        }),
        order: () => ({ data: [], error: null })
      }),
      insert: async () => ({ data: { id: 'local-id' }, error: null }),
      update: () => ({ eq: async () => ({ error: null }) }),
      delete: () => ({ eq: async () => ({ error: null }) })
  })
} as unknown as SupabaseClient;

export const supabase = localMockClient;