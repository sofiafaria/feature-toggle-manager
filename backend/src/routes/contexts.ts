import { Router } from "express";
import { TestConnectionSchema, UpdateEndpointSchema, ContextChangeSchema } from "../schemas.js";
import { getContextEndpoint, pingUrl, setContextEndpoint } from "../services/redis.js";
import { appendAudit } from "../services/audit.js";
import type { AppContextDef } from "../types.js";

export const contextsRouter = Router();

const CONTEXTS: AppContextDef[] = [
  { id: "dev-cloud",     displayName: "DEV - Cloud",     environmentId: "DEV", environmentName: "Development", gatewayType: "Cloud",    endpointUrl: "" },
  { id: "dev-selfhost",  displayName: "DEV - Self-Host", environmentId: "DEV", environmentName: "Development", gatewayType: "SelfHost", endpointUrl: "" },
  { id: "qa-cloud",      displayName: "QA - Cloud",      environmentId: "QA",  environmentName: "QA",          gatewayType: "Cloud",    endpointUrl: "" },
  { id: "qa-selfhost",   displayName: "QA - Self-Host",  environmentId: "QA",  environmentName: "QA",          gatewayType: "SelfHost", endpointUrl: "" },
  { id: "pre-cloud",     displayName: "PRE - Cloud",     environmentId: "PRE", environmentName: "Pre-Prod",    gatewayType: "Cloud",    endpointUrl: "" },
  { id: "pre-selfhost",  displayName: "PRE - Self-Host", environmentId: "PRE", environmentName: "Pre-Prod",    gatewayType: "SelfHost", endpointUrl: "" },
  { id: "prd-cloud",     displayName: "PRD - Cloud",     environmentId: "PRD", environmentName: "Production",  gatewayType: "Cloud",    endpointUrl: "" },
  { id: "prd-selfhost",  displayName: "PRD - Self-Host", environmentId: "PRD", environmentName: "Production",  gatewayType: "SelfHost", endpointUrl: "" },
];

contextsRouter.get("/", (_req, res) => {
  res.json(CONTEXTS.map((c) => ({ ...c, endpointUrl: getContextEndpoint(c.id) })));
});

contextsRouter.get("/:id/endpoint", (req, res) => {
  res.json({ url: getContextEndpoint(req.params.id) });
});

contextsRouter.put("/:id/endpoint", async (req, res) => {
  const body = UpdateEndpointSchema.parse(req.body);
  setContextEndpoint(req.params.id, body.url);
  await appendAudit({
    user: body.user,
    actionType: "SETTINGS_UPDATE",
    contextDisplayName: body.contextDisplayName,
    target: `endpoint=${body.url}`,
    result: "Success",
  });
  res.status(204).send();
});

contextsRouter.post("/test-connection", async (req, res) => {
  const { url } = TestConnectionSchema.parse(req.body);
  res.json(await pingUrl(url));
});

contextsRouter.post("/change", async (req, res) => {
  const body = ContextChangeSchema.parse(req.body);
  await appendAudit({
    user: body.user,
    actionType: "CONTEXT_CHANGE",
    contextDisplayName: body.contextDisplayName,
    target: body.contextDisplayName,
    result: "Success",
  });
  res.status(204).send();
});
