import type { VercelRequest, VercelResponse } from '@vercel/node';
import { aiOrchestrator } from '../../server/aiOrchestrator';
import { featureGate } from '../../server/featureGate';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const input = req.body;
    const userId = req.headers['x-user-id'] as string || 'anon';

    if (!input.topic || typeof input.topic !== 'string' || input.topic.trim().length === 0) {
      return res.status(400).json({ error: "Validation Error: 'topic' field is required and must be a non-empty string" });
    }

    if (!input.audience || typeof input.audience !== 'string') {
      return res.status(400).json({ error: "Validation Error: 'audience' field is required" });
    }

    if (!input.industry || typeof input.industry !== 'string') {
      return res.status(400).json({ error: "Validation Error: 'industry' field is required" });
    }

    if (typeof input.duration !== 'number' || input.duration < 5) {
      return res.status(400).json({ error: "Validation Error: 'duration' must be a number >= 5" });
    }

    if (!['Beginner', 'Intermediate', 'Advanced'].includes(input.depth)) {
      return res.status(400).json({ error: "Validation Error: 'depth' must be one of: Beginner, Intermediate, Advanced" });
    }

    if (input.mode && input.mode !== 'Standard') {
      await featureGate.checkAccess(userId, 'advanced_mode');
    }

    const DEFAULT_MAX_TOKENS = 12_000;
    const ABSOLUTE_MAX_TOKENS = 20_000;
    const requested = typeof input.maxTokens === 'number' ? input.maxTokens : DEFAULT_MAX_TOKENS;
    input.maxTokens = Math.max(1000, Math.min(requested, ABSOLUTE_MAX_TOKENS));

    console.log(`[API] User ${userId} requested knowledge package for topic: ${input.topic}`);
    const result = await aiOrchestrator.generateKnowledgePackage(input, userId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Generate error:', error);
    res.status(error.status || 400).json({ error: error.message });
  }
}
