import type { VercelRequest, VercelResponse } from '@vercel/node';
import { keyManager } from '../../server/services/keyManager';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const userId = req.headers['x-user-id'] as string || 'anon';

    if (req.method === 'GET') {
      const keys = await keyManager.listKeys(userId);
      return res.status(200).json(keys);
    }

    if (req.method === 'POST') {
      const { provider, key, label } = req.body;
      if (!key) throw new Error('Missing API key');
      if (key.length < 10) throw new Error('Invalid key length');

      const resolvedProvider = provider || 'auto';
      const newKey = await keyManager.saveKey(userId, resolvedProvider, key, label || 'My Key');
      return res.status(200).json(newKey);
    }

    if (req.method === 'DELETE') {
      const keyId = req.query.id as string;
      await keyManager.deleteKey(userId, keyId);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
