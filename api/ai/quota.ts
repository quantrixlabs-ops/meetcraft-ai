import type { VercelRequest, VercelResponse } from '@vercel/node';
import { queryOne, query } from '../../lib/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    res.setHeader('Content-Type', 'application/json');
    const userId = req.headers['x-user-id'] as string || 'anon';

    let quota = await queryOne(
      'SELECT requests_used as "used", requests_limit as "limit", reset_date as "resetDate", tier FROM user_quotas WHERE user_id = $1',
      [userId]
    );

    if (!quota) {
      // Create default quota for new user
      await query(
        'INSERT INTO user_quotas (user_id, requests_used, requests_limit, reset_date, tier) VALUES ($1, 0, 20, NOW() + INTERVAL \'1 day\', \'free\')',
        [userId]
      );
      quota = {
        used: 0,
        limit: 20,
        resetDate: new Date(Date.now() + 86400000).toISOString(),
        tier: 'free'
      };
    }

    res.status(200).json({
      remaining: quota.limit - quota.used,
      total: quota.limit,
      used: quota.used,
      tier: quota.tier,
      resetDate: quota.resetDate
    });
  } catch (error: any) {
    console.error('Quota API error:', error);
    res.status(400).json({ error: error.message });
  }
}
