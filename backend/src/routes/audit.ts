import { Router } from "express";
import { ContextChangeSchema } from "../schemas.js";
import { appendAudit, readAudit } from "../services/audit.js";

export const auditRouter = Router();

auditRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await readAudit());
  } catch (e) {
    next(e);
  }
});

auditRouter.post("/context-change", async (req, res, next) => {
  try {
    const body = ContextChangeSchema.parse(req.body);
    await appendAudit({
      user: body.user,
      actionType: "CONTEXT_CHANGE",
      contextDisplayName: body.contextDisplayName,
      target: body.contextDisplayName,
      result: "Success",
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
