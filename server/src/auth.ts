import type { NextFunction, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from './config.js';
import { getUserRow, touchActivity, type UserRow } from './db.js';

export interface AuthedRequest extends Request {
  userId?: string;
  user?: UserRow;
}

export function signToken(userId: string): string {
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId }, config.jwtSecret, options);
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** Hard auth: rejects the request when no valid user is present. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const user = getUserRow(userId);
  if (!user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  req.userId = userId;
  req.user = user;
  touchActivity(userId);
  next();
}
