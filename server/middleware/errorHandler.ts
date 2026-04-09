import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("🔥 Server Error:", err);

  // Determine status code from error
  let statusCode = 500;
  let message = err.message || 'Internal Server Error';

  if (typeof (err as any).status === 'number') {
    statusCode = (err as any).status;
  } else if (message.includes('VITE_GEMINI_API_KEY') || message.includes('not configured')) {
    statusCode = 503; // Service Unavailable
  } else if (message.includes('Unauthorized') || message.includes('not authenticated')) {
    statusCode = 401;
  } else if (message.includes('Forbidden') || message.includes('not permitted')) {
    statusCode = 403;
  } else if (message.includes('validation') || message.includes('invalid')) {
    statusCode = 400; // Bad Request
  } else if (message.includes('timeout') || message.includes('TIMEOUT')) {
    statusCode = 504; // Gateway Timeout
  }

  res.status(statusCode).json({
    error: {
      message,
      code: statusCode,
      timestamp: new Date().toISOString()
    }
  });
};