import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    res.setHeader('Content-Type', 'application/json');

    // Temporary: return mock data to verify API works
    if (req.method === 'GET') {
      // Return empty array (not an object with keys property)
      return res.status(200).json([]);
    }

    if (req.method === 'POST') {
      return res.status(200).json({
        id: 'key_' + Date.now(),
        provider: req.body.provider || 'auto',
        label: req.body.label || 'My Key',
        keyMask: '****',
        isActive: false
      });
    }

    if (req.method === 'DELETE') {
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
