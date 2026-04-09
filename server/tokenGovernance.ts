import { supabaseAdmin } from './lib/supabase';

interface TokenLog {
  userId: string;
  feature: string;
  timestamp: number;
  estimatedTokens: number;
}

class TokenGovernanceSystem {
  private logs: TokenLog[] = [];
  private DAILY_LIMIT = 1000000; 

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  public async trackRequest(userId: string, feature: string, prompt: string): Promise<void> {
    const cost = this.estimateTokens(prompt);
    
    // Log to Supabase async (don't block)
    if (userId !== 'anon' && userId !== 'anon_user') {
       supabaseAdmin.from('usage_logs').insert({
         user_id: userId,
         feature,
         tokens: cost
       }).then(({ error }) => {
         if (error) console.error("Failed to log usage:", error);
       });
    }

    console.log(`[TokenGovernance] ${feature} | User: ${userId} | Cost: ~${cost}`);
  }

  public trackResponse(userId: string, feature: string, response: string): void {
    const cost = this.estimateTokens(response);
    
    if (userId !== 'anon' && userId !== 'anon_user') {
        supabaseAdmin.from('usage_logs').insert({
          user_id: userId,
          feature: feature + "_response",
          tokens: cost
        }).then(({ error }) => {
          if (error) console.error("Failed to log response usage:", error);
        });
     }
  }
}

export const tokenGovernance = new TokenGovernanceSystem();