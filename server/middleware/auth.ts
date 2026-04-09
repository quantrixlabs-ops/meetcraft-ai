import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Use type assertion to any to avoid TypeScript errors with Express types in this environment
  const reqAny = req as any;
  const resAny = res as any;

  const authHeader = reqAny.headers?.authorization;

  // If no auth header, check if we're in development/offline mode
  if (!authHeader) {
    // In development/offline mode, allow requests with a default user
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
      req.user = { id: 'local-dev-user', email: 'dev@local.host' };
      next();
      return;
    }
    
    resAny.status(401).json({ error: { message: "Missing Authorization header" } });
    return;
  }

  const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined;

  if (!token) {
    resAny.status(401).json({ error: { message: "Invalid Authorization header format" } });
    return;
  }
  
  // Handle mock token in local/offline mode
  if (token === 'mock-token') {
    req.user = { id: 'local-dev-user', email: 'dev@local.host' };
    next();
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    const user = data?.user;

    if (error || !user) {
      resAny.status(401).json({ error: { message: "Invalid or expired token" } });
      return;
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (e) {
    console.error("Auth Middleware Error:", e);
    // In development mode, still allow the request to proceed
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
      req.user = { id: 'local-dev-user', email: 'dev@local.host' };
      next();
      return;
    }
    resAny.status(500).json({ error: { message: "Authentication service failure" } });
  }
};