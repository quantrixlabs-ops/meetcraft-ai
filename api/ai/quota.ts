import type { VercelRequest, VercelResponse } from '@vercel/node';
import { featureGate } from '../../server/featureGate';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const userId = req.headers['x-user-id'] as string || 'anon';
    const quota = await featureGate.getQuota(userId);
    res.status(200).json(quota);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
