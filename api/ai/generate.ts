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

    // Mock response with proper structure
    res.status(200).json({
      topic: input.topic,
      audience: input.audience || 'General',
      industry: input.industry || 'Technology',
      depth: input.depth || 'Intermediate',
      duration: input.duration || 30,
      chapters: [
        {
          title: 'Introduction',
          content: 'Mock content - real backend needed',
          duration: 5
        }
      ],
      summary: `Knowledge package for ${input.topic}`,
      estimatedReadTime: input.duration || 30,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
