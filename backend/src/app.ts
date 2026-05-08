import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { contextsRouter } from "./routes/contexts.js";
import { apisRouter, tagsRouter } from "./routes/apis.js";
import { togglesRouter } from "./routes/toggles.js";
import { auditRouter } from "./routes/audit.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);

  // Everything below requires auth
  app.use(requireAuth);
  app.use("/contexts", contextsRouter);
  app.use("/apis", apisRouter);
  app.use("/tags", tagsRouter);
  app.use("/toggles", togglesRouter);
  app.use("/audit", auditRouter);

  app.use(errorHandler);
  return app;
}
