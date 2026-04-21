import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      return res.status(400).json({ error: 'DATABASE_URL not set' });
    }

    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });

    const result = await pool.query('SELECT NOW()');
    await pool.end();

    res.status(200).json({
      success: true,
      message: 'Database connected successfully!',
      timestamp: result.rows[0]
    });
  } catch (error: any) {
    console.error('DB Test Error:', error);
    res.status(500).json({
      error: error.message,
      details: error.toString()
    });
  }
}
