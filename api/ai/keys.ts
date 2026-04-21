import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, queryOne } from '../../lib/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    res.setHeader('Content-Type', 'application/json');
    const userId = req.headers['x-user-id'] as string || 'anon';

    if (req.method === 'GET') {
      const keys = await query(
        'SELECT id, provider, label, key_mask as "keyMask", is_active as "isActive", created_at as "createdAt" FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return res.status(200).json(keys);
    }

    if (req.method === 'POST') {
      const { provider, key, label } = req.body;
      if (!key) return res.status(400).json({ error: 'Missing API key' });
      if (key.length < 10) return res.status(400).json({ error: 'Invalid key length' });

      const keyMask = key.slice(-4);
      const newKey = await queryOne(
        'INSERT INTO api_keys (user_id, provider, key_encrypted, key_mask, label) VALUES ($1, $2, $3, $4, $5) RETURNING id, provider, label, key_mask as "keyMask", is_active as "isActive"',
        [userId, provider || 'auto', key, keyMask, label || 'My Key']
      );
      return res.status(200).json(newKey);
    }

    if (req.method === 'DELETE') {
      const keyId = req.query.id as string;
      await query('DELETE FROM api_keys WHERE id = $1 AND user_id = $2', [keyId, userId]);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Keys API error:', error);
    res.status(400).json({ error: error.message });
  }
}
