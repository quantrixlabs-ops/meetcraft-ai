import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    res.setHeader('Content-Type', 'application/json');

    // Temporary: return mock data to verify API works
    if (req.method === 'GET') {
      return res.status(200).json({
        keys: [],
        message: 'API endpoint is working! Backend integration coming soon.'
      });
    }

    if (req.method === 'POST') {
      return res.status(200).json({
        id: 'key_' + Date.now(),
        provider: req.body.provider || 'auto',
        label: req.body.label || 'My Key',
        message: 'Key would be saved (mock mode)'
      });
    }

    if (req.method === 'DELETE') {
      return res.status(200).json({ success: true, message: 'Key would be deleted (mock mode)' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
