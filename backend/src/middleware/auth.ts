import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const SESSION_COOKIE = "ftm_session";

export interface SessionPayload {
  sub: string; // username
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, config.sessionSecret, { expiresIn: "8h" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, config.sessionSecret) as SessionPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  const session = verifySession(token);
  if (!session) return res.status(401).json({ error: "Invalid session" });
  (req as Request & { user: SessionPayload }).user = session;
  next();
}
