import type { Api, Operation, AllowlistEntry, BlockedOperation, ToggleState, AuditRecord, AuditActionType, AuditResult, AppContextDef } from "@/types/domain";
import { buildOperationKey } from "@/types/domain";
import { APIS, getOperationsForApi, INITIAL_ALLOWLIST, ALL_TAGS, CONTEXTS } from "./data";

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

let allowlist: AllowlistEntry[] = [...INITIAL_ALLOWLIST];
let auditLog: AuditRecord[] = [];
let contextEndpoints: Record<string, string> = {};
// Initialize from CONTEXTS
CONTEXTS.forEach(c => { contextEndpoints[c.id] = c.endpointUrl; });

let auditIdCounter = 0;

function addAudit(user: string, actionType: AuditActionType, contextDisplayName: string, target: string, result: AuditResult = "Success") {
  auditLog.unshift({
    id: `audit-${++auditIdCounter}`,
    user,
    timestamp: new Date().toISOString(),
    actionType,
    contextDisplayName,
    target,
    result,
  });
}

export const mockApi = {
  // Auth
  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    await delay(500);
    if (username === "admin" && password === "admin123") return { success: true };
    return { success: false, error: "Invalid credentials" };
  },

  // Contexts
  getContexts(): AppContextDef[] {
    return CONTEXTS.map(c => ({ ...c, endpointUrl: contextEndpoints[c.id] || c.endpointUrl }));
  },

  // APIs
  async getApis(search?: string): Promise<Api[]> {
    await delay();
    let apis = [...APIS];
    if (search) {
      const s = search.toLowerCase();
      apis = apis.filter(a => a.displayName.toLowerCase().includes(s) || a.path.toLowerCase().includes(s));
    }
    return apis;
  },

  // Operations
  async getOperations(apiName: string): Promise<Operation[]> {
    await delay();
    return getOperationsForApi(apiName);
  },

  // Tags
  async getTags(): Promise<string[]> {
    await delay();
    return ALL_TAGS;
  },

  // State check
  getToggleState(serviceName: string, apiName: string, method: string, urlTemplate: string, contextId: string): ToggleState {
    const key = buildOperationKey(serviceName, apiName, method, urlTemplate);
    const found = allowlist.some(e => e.operationKey === key && e.contextId === contextId);
    return found ? "Unblocked" : "Blocked";
  },

  // Blocked operations
  async getBlockedOperations(serviceName: string, contextId: string): Promise<BlockedOperation[]> {
    await delay();
    const blocked: BlockedOperation[] = [];
    for (const api of APIS) {
      const ops = getOperationsForApi(api.name);
      for (const op of ops) {
        const key = buildOperationKey(serviceName, api.name, op.method, op.urlTemplate);
        if (!allowlist.some(e => e.operationKey === key && e.contextId === contextId)) {
          blocked.push({
            operationKey: key, serviceName, apiName: api.name, apiDisplayName: api.displayName,
            apiPath: api.path, operationName: op.name, operationDisplayName: op.displayName,
            method: op.method, urlTemplate: op.urlTemplate, state: "Blocked",
          });
        }
      }
    }
    return blocked;
  },

  // Unblock
  async unblock(items: { serviceName: string; apiName: string; method: string; urlTemplate: string }[], contextId: string, user: string, contextDisplayName: string): Promise<void> {
    await delay(400);
    for (const item of items) {
      const key = buildOperationKey(item.serviceName, item.apiName, item.method, item.urlTemplate);
      if (!allowlist.some(e => e.operationKey === key && e.contextId === contextId)) {
        allowlist.push({ operationKey: key, contextId });
      }
    }
    const actionType: AuditActionType = items.length > 1 ? "BULK_UNBLOCK" : "UNBLOCK";
    const target = items.length === 1 ? buildOperationKey(items[0].serviceName, items[0].apiName, items[0].method, items[0].urlTemplate) : `${items.length} operations`;
    addAudit(user, actionType, contextDisplayName, target);
  },

  // Block
  async block(items: { serviceName: string; apiName: string; method: string; urlTemplate: string }[], contextId: string, user: string, contextDisplayName: string): Promise<void> {
    await delay(400);
    for (const item of items) {
      const key = buildOperationKey(item.serviceName, item.apiName, item.method, item.urlTemplate);
      allowlist = allowlist.filter(e => !(e.operationKey === key && e.contextId === contextId));
    }
    const actionType: AuditActionType = items.length > 1 ? "BULK_BLOCK" : "BLOCK";
    const target = items.length === 1 ? buildOperationKey(items[0].serviceName, items[0].apiName, items[0].method, items[0].urlTemplate) : `${items.length} operations`;
    addAudit(user, actionType, contextDisplayName, target);
  },

  // Bulk by tag
  async bulkByTag(serviceName: string, tagNames: string[], action: "block" | "unblock", contextId: string, user: string, contextDisplayName: string): Promise<number> {
    await delay(600);
    const matchingApis = APIS.filter(a => a.tags.some(t => tagNames.includes(t)));
    const items: { serviceName: string; apiName: string; method: string; urlTemplate: string }[] = [];
    for (const api of matchingApis) {
      const ops = getOperationsForApi(api.name);
      for (const op of ops) {
        items.push({ serviceName, apiName: api.name, method: op.method, urlTemplate: op.urlTemplate });
      }
    }
    if (action === "unblock") await this.unblock(items, contextId, user, contextDisplayName);
    else await this.block(items, contextId, user, contextDisplayName);
    return items.length;
  },

  // Allowlist raw
  getAllowlist(): AllowlistEntry[] {
    return [...allowlist];
  },

  // Context endpoints
  getContextEndpoint(contextId: string): string {
    return contextEndpoints[contextId] || "";
  },

  updateContextEndpoint(contextId: string, url: string, user: string, contextDisplayName: string) {
    contextEndpoints[contextId] = url;
    addAudit(user, "SETTINGS_UPDATE", contextDisplayName, `Endpoint updated to ${url}`);
  },

  async testConnection(url: string): Promise<{ success: boolean; error?: string }> {
    await delay(800);
    try {
      new URL(url);
      // Simulate: most URLs succeed, empty/invalid fail
      if (!url || url.length < 10) return { success: false, error: "Invalid URL" };
      return { success: true };
    } catch {
      return { success: false, error: "Invalid URL format" };
    }
  },

  // Audit
  logContextChange(user: string, contextDisplayName: string) {
    addAudit(user, "CONTEXT_CHANGE", contextDisplayName, `Switched to ${contextDisplayName}`);
  },

  getAuditLog(): AuditRecord[] {
    return [...auditLog];
  },
};
