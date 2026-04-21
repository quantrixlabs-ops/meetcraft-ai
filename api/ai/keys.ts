import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET') {
      // Return empty array (no keys stored)
      return res.status(200).json([]);
    }

    if (req.method === 'POST') {
      const { provider, key, label } = req.body;
      if (!key) return res.status(400).json({ error: 'Missing API key' });
      if (key.length < 10) return res.status(400).json({ error: 'Invalid key length' });

      // Return mock saved key
      return res.status(200).json({
        id: 'key_' + Math.random().toString(36).substr(2, 9),
        provider: provider || 'auto',
        label: label || 'My Key',
        keyMask: '****' + key.slice(-4),
        isActive: true
      });
    }

    if (req.method === 'DELETE') {
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
