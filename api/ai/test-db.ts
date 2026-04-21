import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(400).json({ error: 'DATABASE_URL not set' });
    }

    await client.connect();
    const result = await client.query('SELECT NOW()');

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
  } finally {
    await client.end();
  }
}
