import { Router } from 'express';
import { aiOrchestrator } from './aiOrchestrator';
import { upload } from './middleware/upload';
import { extractTextFromFile, sanitizeContext } from './utils/textExtractor';
import { authenticateUser, AuthenticatedRequest } from './middleware/auth';
import { featureGate } from './featureGate';
import { keyManager } from './services/keyManager';

export const aiRouter = Router();

// Apply Auth Middleware to all AI routes
//aiRouter.use(authenticateUser as any);

aiRouter.get('/quota', async (req: any, res, next) => {
  try {
    const userId = req.user?.id || 'anon';
    const quota = await featureGate.getQuota(userId);
    res.json(quota);
  } catch (error) {
    next(error);
  }
});

// --- KEY MANAGEMENT ROUTES ---

aiRouter.get('/keys', async (req: any, res, next) => {
  try {
    const userId = req.user?.id || 'anon';
    const keys = await keyManager.listKeys(userId);
    res.json(keys);
  } catch (error) {
    next(error);
  }
});

aiRouter.post('/keys', async (req: any, res, next) => {
  try {
    const userId = req.user?.id || 'anon';
    const { provider, key, label } = req.body;
    if (!key) throw new Error("Missing API key");
    
    // Simple Validation (could be improved by making a dummy call)
    if (key.length < 10) throw new Error("Invalid key length");

    // provider is now optional — keyManager auto-detects from key prefix when 'auto' or omitted
    const resolvedProvider = provider || 'auto';
    const newKey = await keyManager.saveKey(userId, resolvedProvider, key, label || 'My Key');
    res.json(newKey);
  } catch (error) {
    next(error);
  }
});

aiRouter.delete('/keys/:id', async (req: any, res, next) => {
  try {
    const userId = req.user?.id || 'anon';
    await keyManager.deleteKey(userId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// --- AI GENERATION ROUTES ---

aiRouter.post('/generate', async (req: any, res, next) => {
  try {
    const input = req.body;
    const userId = req.user?.id || 'anon';
    
    // Validate required fields
    if (!input.topic || typeof input.topic !== 'string' || input.topic.trim().length === 0) {
      const error: any = new Error("Validation Error: 'topic' field is required and must be a non-empty string");
      error.status = 400;
      throw error;
    }
    
    if (!input.audience || typeof input.audience !== 'string') {
      const error: any = new Error("Validation Error: 'audience' field is required");
      error.status = 400;
      throw error;
    }
    
    if (!input.industry || typeof input.industry !== 'string') {
      const error: any = new Error("Validation Error: 'industry' field is required");
      error.status = 400;
      throw error;
    }
    
    if (typeof input.duration !== 'number' || input.duration < 5) {
      const error: any = new Error("Validation Error: 'duration' must be a number >= 5");
      error.status = 400;
      throw error;
    }
    
    if (!['Beginner', 'Intermediate', 'Advanced'].includes(input.depth)) {
      const error: any = new Error("Validation Error: 'depth' must be one of: Beginner, Intermediate, Advanced");
      error.status = 400;
      throw error;
    }

    // Validate Tier for advanced modes
    if (input.mode && input.mode !== 'Standard') {
       await featureGate.checkAccess(userId, 'advanced_mode');
    }

    // Clamp token budget to safe range
    const DEFAULT_MAX_TOKENS  = 12_000;
    const ABSOLUTE_MAX_TOKENS = 20_000;
    const requested = typeof input.maxTokens === 'number' ? input.maxTokens : DEFAULT_MAX_TOKENS;
    input.maxTokens = Math.max(1000, Math.min(requested, ABSOLUTE_MAX_TOKENS));

    console.log(`[API] User ${userId} requested knowledge package for topic: ${input.topic}`);
    const result = await aiOrchestrator.generateKnowledgePackage(input, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

aiRouter.post('/upload', upload.single('file'), async (req: any, res, next) => {
  try {
    if (!req.file) throw new Error("No file uploaded");
    const userId = req.user?.id || 'anon';
    const rawText = await extractTextFromFile(req.file.buffer, req.file.mimetype);
    const cleanContext = sanitizeContext(rawText);
    // Use generateKnowledgePackage as fallback for context-based generation
    const input = {
      topic: "Document Summary",
      audience: "General",
      industry: "General",
      depth: "Intermediate" as const,
      duration: 10,
      tone: "Educational" as const,
      context: cleanContext,
      mode: "Standard" as const
    };
    const result = await aiOrchestrator.generateKnowledgePackage(input, userId);
    res.json({ summary: result });
  } catch (error) {
    next(error);
  }
});

aiRouter.post('/image', async (req: any, res, next) => {
  // Not implemented: image generation
  res.status(501).json({ error: "Image generation not supported." });
});

aiRouter.post('/video', async (req: any, res, next) => {
  // Not implemented: video generation
  res.status(501).json({ error: "Video generation not supported." });
});

aiRouter.post('/podcast', async (req: any, res, next) => {
  // Not implemented: podcast generation
  res.status(501).json({ error: "Podcast generation not supported." });
});

aiRouter.post('/quiz', async (req: any, res, next) => {
  // Not implemented: quiz generation
  res.status(501).json({ error: "Quiz generation not supported." });
});

aiRouter.post('/flashcards', async (req: any, res, next) => {
  // Not implemented: flashcard generation
  res.status(501).json({ error: "Flashcard generation not supported." });
});

aiRouter.post('/chat', async (req: any, res, next) => {
    try {
        const { message, context } = req.body;
        const userId = req.user?.id || 'anon';
        // Use generateKnowledgePackage for chat endpoint
        const input = {
          topic: message || "Chat Message",
          audience: "General",
          industry: "General",
          depth: "Intermediate" as const,
          duration: 10,
          tone: "Educational" as const,
          context: context || "",
          mode: "Standard" as const
        };
        const result = await aiOrchestrator.generateKnowledgePackage(input, userId);
        res.json({ text: result });
    } catch (error) {
        next(error);
    }
});

// FILE UPLOAD ENDPOINT
aiRouter.post('/upload-document', upload.single('file'), async (req: any, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('No file provided');
      (error as any).status = 400;
      throw error;
    }

    const userId = req.user?.id || 'anon';
    const file = req.file;
    
    console.log(`[UPLOAD] User ${userId} uploading file: ${file.originalname} (${file.size} bytes)`);

    // Extract text from the uploaded file
    const extractedText = await extractTextFromFile(file.buffer, file.mimetype);
    
    if (!extractedText || extractedText.trim().length === 0) {
      const error = new Error('Failed to extract text from file or file is empty');
      (error as any).status = 400;
      throw error;
    }

    // Store file metadata and extracted content in memory for session
    // In a production app, you'd store this in a database
    const fileMetadata = {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      extractedTextLength: extractedText.length,
      userId
    };

    console.log(`[UPLOAD] File processed successfully: ${extractedText.length} characters extracted`);

    res.status(200).json({
      success: true,
      message: 'File uploaded and processed successfully',
      file: fileMetadata,
      textLength: extractedText.length
    });
  } catch (error) {
    console.error('[UPLOAD] Error:', error);
    next(error);
  }
});