import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = !!(supabaseUrl && supabaseServiceKey && !supabaseUrl.toLowerCase().includes('placeholder'));

// Chainable mock that returns itself for any query-builder method,
// and resolves to { data: null/[], error: null } for terminal calls.
function mockQuery(isList = false) {
  const terminal = isList
    ? { data: [] as any[], error: null }
    : { data: null, error: { message: "Mock Mode" } };

  const chain: any = {
    eq:     () => chain,
    neq:    () => chain,
    order:  () => chain,
    limit:  () => chain,
    range:  () => chain,
    filter: () => chain,
    match:  () => chain,
    select: () => chain,
    single: async () => terminal,
    then:   (resolve: any) => Promise.resolve(terminal).then(resolve),
  };
  return chain;
}

const mockClient = {
  from: () => ({
    select: (..._a: any[]) => mockQuery(true),
    insert: async () => ({ data: null, error: null }),
    update: () => mockQuery(),
    upsert: async () => ({ data: null, error: null }),
    delete: () => mockQuery(),
  }),
  rpc: async () => ({ data: [], error: null }),
  auth: {
    getUser: async (token: string) => {
      if (token === 'mock-token') {
        return {
          data: { user: { id: 'local-dev-user', email: 'dev@local.host' } },
          error: null,
        };
      }
      return { data: { user: null }, error: { message: "Mock Auth Failed" } };
    },
  },
} as unknown as SupabaseClient;

if (!isConfigured) {
  console.warn("⚠️  Backend: Supabase not configured. Using Mock DB Client.");
}

export const supabaseAdmin = isConfigured 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : mockClient;