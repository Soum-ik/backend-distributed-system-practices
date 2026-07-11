import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.ts';
import { AppError } from '../utils/AppError.ts';

export interface AuthContext {
  userId: string;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('authorization required', 401);
  }
  const userId = await verifyToken(header.slice(7));
  req.auth = { userId };
  next();
}

export function getUserId(req: Request): string {
  if (!req.auth?.userId) throw new AppError('authorization required', 401);
  return req.auth.userId;
}
