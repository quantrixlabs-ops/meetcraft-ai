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
    await client.connect();

    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );

    res.status(200).json({
      success: true,
      tables: result.rows.map(r => r.table_name)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.end();
  }
}
