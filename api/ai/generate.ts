import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    res.setHeader('Content-Type', 'application/json');
    const input = req.body;

    if (!input.topic || typeof input.topic !== 'string' || input.topic.trim().length === 0) {
      return res.status(400).json({ error: "Validation Error: 'topic' field is required" });
    }

    // Mock response - indicates API is working
    res.status(200).json({
      success: true,
      topic: input.topic,
      message: 'Generate endpoint working (mock mode - backend integration needed)',
      chapters: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        status: 'mock_response'
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
