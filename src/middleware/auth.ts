import type { NextFunction, Response } from 'express';
import { verifyAuthToken } from '../services/authService';
import type { AuthenticatedRequest } from '../types/api';

function getBearerToken(headerValue: string | undefined): string | undefined {
  if (!headerValue) {
    return undefined;
  }

  const [scheme, token] = headerValue.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return undefined;
  }

  return token;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = getBearerToken(req.header('authorization'));

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const claims = verifyAuthToken(token);
    req.auth = {
      userId: claims.sub,
      email: claims.email,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function getAuthenticatedUserId(req: AuthenticatedRequest): string {
  if (!req.auth?.userId) {
    throw new Error('Missing authenticated user');
  }

  return req.auth.userId;
}
