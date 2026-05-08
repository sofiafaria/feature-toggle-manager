import { Router } from "express";
import rateLimit from "express-rate-limit";
import { LoginSchema } from "../schemas.js";
import { config } from "../config.js";
import { SESSION_COOKIE, signSession } from "../middleware/auth.js";

export const authRouter = Router();

const loginLimiter = rateLimit({ windowMs: 60_000, limit: 5 });

authRouter.post("/login", loginLimiter, (req, res) => {
  const { username, password } = LoginSchema.parse(req.body);
  if (username !== config.admin.username || password !== config.admin.password) {
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }
  const token = signSession({ sub: username });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.env === "production",
    maxAge: 8 * 60 * 60 * 1000,
  });
  res.json({ success: true });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.status(204).send();
});
