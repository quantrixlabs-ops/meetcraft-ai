import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

async function getKeys(userId: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, provider, label, key_mask as "keyMask", is_active as "isActive", created_at as "createdAt" FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  } finally {
    await client.end();
  }
}

async function saveKey(userId: string, provider: string, key: string, label: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const keyMask = key.slice(-4);
    const result = await client.query(
      'INSERT INTO api_keys (user_id, provider, key_encrypted, key_mask, label) VALUES ($1, $2, $3, $4, $5) RETURNING id, provider, label, key_mask as "keyMask", is_active as "isActive"',
      [userId, provider || 'auto', key, keyMask, label || 'My Key']
    );
    return result.rows[0];
  } finally {
    await client.end();
  }
}

async function deleteKey(userId: string, keyId: string) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query('DELETE FROM api_keys WHERE id = $1 AND user_id = $2', [keyId, userId]);
  } finally {
    await client.end();
  }
}

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Content-Type', 'application/json');
    const userId = req.headers['x-user-id'] || 'anon';

    if (req.method === 'GET') {
      const keys = await getKeys(userId);
      return res.status(200).json(keys);
    }

    if (req.method === 'POST') {
      const { provider, key, label } = req.body;
      if (!key) return res.status(400).json({ error: 'Missing API key' });
      if (key.length < 10) return res.status(400).json({ error: 'Invalid key length' });

      const newKey = await saveKey(userId, provider, key, label);
      return res.status(200).json(newKey);
    }

    if (req.method === 'DELETE') {
      const keyId = req.query.id;
      await deleteKey(userId, keyId);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Keys API error:', error);
    res.status(500).json({ error: error.message });
  }
}
