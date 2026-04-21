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

    // Test the query
    const result = await client.query(
      'SELECT * FROM api_keys LIMIT 1'
    );

    res.status(200).json({
      success: true,
      rowCount: result.rowCount,
      rows: result.rows,
      fields: result.fields?.map(f => ({ name: f.name, type: f.dataTypeID }))
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await client.end();
  }
}
