import { Router } from "express";
import { BulkByTagSchema, ToggleBatchSchema } from "../schemas.js";
import { RedisRepo } from "../services/redis.js";
import { ApimService } from "../services/apim.js";
import { appendAudit } from "../services/audit.js";
import { buildOperationKey } from "../types.js";

export const togglesRouter = Router();

togglesRouter.get("/blocked", async (req, res, next) => {
  try {
    const service = String(req.query.service ?? "");
    const contextId = String(req.query.contextId ?? "");
    if (!service || !contextId) return res.status(400).json({ error: "service and contextId required" });
    res.json(await RedisRepo.listBlocked(contextId, service));
  } catch (e) {
    next(e);
  }
});

togglesRouter.get("/check", async (req, res, next) => {
  try {
    const service = String(req.query.service ?? "");
    const api = String(req.query.api ?? "");
    const method = String(req.query.method ?? "");
    const url = String(req.query.url ?? "");
    const contextId = String(req.query.contextId ?? "");
    const key = buildOperationKey(service, api, method, url);
    const blocked = await RedisRepo.isBlocked(contextId, service, key);
    if (!blocked) return res.status(404).json({ allowed: true });
    res.json({ allowed: false });
  } catch (e) {
    next(e);
  }
});

async function applyBatch(action: "block" | "unblock", body: ReturnType<typeof ToggleBatchSchema.parse>) {
  for (const it of body.items) {
    const key = buildOperationKey(it.serviceName, it.apiName, it.method, it.urlTemplate);
    if (action === "block") await RedisRepo.block(body.contextId, it.serviceName, key);
    else await RedisRepo.unblock(body.contextId, it.serviceName, key);
  }
}

togglesRouter.post("/block", async (req, res, next) => {
  try {
    const body = ToggleBatchSchema.parse(req.body);
    await applyBatch("block", body);
    await appendAudit({
      user: body.user,
      actionType: body.items.length > 1 ? "BULK_BLOCK" : "BLOCK",
      contextDisplayName: body.contextDisplayName,
      target: body.items.map((i) => buildOperationKey(i.serviceName, i.apiName, i.method, i.urlTemplate)).join(", "),
      result: "Success",
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

togglesRouter.post("/unblock", async (req, res, next) => {
  try {
    const body = ToggleBatchSchema.parse(req.body);
    await applyBatch("unblock", body);
    await appendAudit({
      user: body.user,
      actionType: body.items.length > 1 ? "BULK_UNBLOCK" : "UNBLOCK",
      contextDisplayName: body.contextDisplayName,
      target: body.items.map((i) => buildOperationKey(i.serviceName, i.apiName, i.method, i.urlTemplate)).join(", "),
      result: "Success",
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

togglesRouter.post("/bulk-by-tag", async (req, res, next) => {
  try {
    const body = BulkByTagSchema.parse(req.body);
    const ops = await ApimService.listOperationsByTag(body.serviceName, body.tagNames);
    for (const op of ops) {
      const key = buildOperationKey(body.serviceName, op.apiName, op.method, op.urlTemplate);
      if (body.action === "block") await RedisRepo.block(body.contextId, body.serviceName, key);
      else await RedisRepo.unblock(body.contextId, body.serviceName, key);
    }
    await appendAudit({
      user: body.user,
      actionType: body.action === "block" ? "BULK_BLOCK" : "BULK_UNBLOCK",
      contextDisplayName: body.contextDisplayName,
      target: `tags=[${body.tagNames.join(",")}] count=${ops.length}`,
      result: "Success",
    });
    res.json({ count: ops.length });
  } catch (e) {
    next(e);
  }
});
