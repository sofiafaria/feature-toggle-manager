import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      type: "about:blank",
      title: "Validation error",
      status: 400,
      detail: err.message,
      errors: err.flatten(),
    });
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({
    type: "about:blank",
    title: "Internal server error",
    status: 500,
    detail: message,
  });
}
