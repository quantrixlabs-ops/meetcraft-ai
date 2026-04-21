import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    res.setHeader('Content-Type', 'application/json');

    // Mock quota response
    res.status(200).json({
      remaining: 10,
      total: 20,
      resetDate: new Date(Date.now() + 86400000).toISOString(),
      message: 'Quota API working (mock mode)'
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
