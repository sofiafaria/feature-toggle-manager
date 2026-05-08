import { v4 as uuid } from "uuid";
import { getRedis } from "./redis.js";
import type { AuditActionType, AuditRecord, AuditResult } from "../types.js";

const STREAM = "audit:log";
const AUDIT_CONTEXT = "_audit"; // dedicated redis client slot

export async function appendAudit(rec: Omit<AuditRecord, "id" | "timestamp">): Promise<AuditRecord> {
  const full: AuditRecord = {
    id: uuid(),
    timestamp: new Date().toISOString(),
    ...rec,
  };
  const r = getRedis(AUDIT_CONTEXT);
  await r.xadd(
    STREAM,
    "*",
    "id", full.id,
    "user", full.user,
    "timestamp", full.timestamp,
    "actionType", full.actionType,
    "contextDisplayName", full.contextDisplayName,
    "target", full.target,
    "result", full.result,
  );
  return full;
}

export async function readAudit(): Promise<AuditRecord[]> {
  const r = getRedis(AUDIT_CONTEXT);
  const entries = await r.xrevrange(STREAM, "+", "-", "COUNT", 1000);
  return entries.map(([, fields]) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) obj[fields[i]] = fields[i + 1];
    return {
      id: obj.id,
      user: obj.user,
      timestamp: obj.timestamp,
      actionType: obj.actionType as AuditActionType,
      contextDisplayName: obj.contextDisplayName,
      target: obj.target,
      result: obj.result as AuditResult,
    };
  });
}
