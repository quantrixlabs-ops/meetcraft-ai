import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    res.setHeader('Content-Type', 'application/json');

    // Mock quota response
    res.status(200).json({
      remaining: 15,
      total: 20,
      used: 5,
      tier: 'free',
      resetDate: new Date(Date.now() + 86400000).toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
