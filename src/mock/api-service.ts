import type { Environment, ApimService, Api, Operation, AllowlistEntry, Gateway, BlockedOperation, ToggleState, AppContext, PolicyMode } from "@/types/domain";
import { buildOperationKey } from "@/types/domain";
import { ENVIRONMENTS, SERVICES, APIS, getOperationsForApi, INITIAL_ALLOWLIST, GATEWAYS, ALL_TAGS } from "./data";

// Simulated delay
const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// In-memory allowlist store
let allowlist: AllowlistEntry[] = [...INITIAL_ALLOWLIST];
let policyMode: PolicyMode = "BACKOFFICE_CHECK";

export const mockApi = {
  // Auth
  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    await delay(500);
    if (username === "admin" && password === "admin123") {
      return { success: true };
    }
    return { success: false, error: "Invalid credentials" };
  },

  // Environments
  async getEnvironments(): Promise<Environment[]> {
    await delay();
    return ENVIRONMENTS;
  },

  // Services
  async getServices(_envId?: string): Promise<ApimService[]> {
    await delay();
    return SERVICES;
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

  // Gateways
  async getGateways(): Promise<Gateway[]> {
    await delay();
    return GATEWAYS;
  },

  // State check
  getToggleState(serviceName: string, apiName: string, method: string, urlTemplate: string, _gatewayId?: string): ToggleState {
    const key = buildOperationKey(serviceName, apiName, method, urlTemplate);
    const found = allowlist.some(e => e.operationKey === key);
    return found ? "Unblocked" : "Blocked";
  },

  // Blocked operations
  async getBlockedOperations(serviceName: string): Promise<BlockedOperation[]> {
    await delay();
    const blocked: BlockedOperation[] = [];
    for (const api of APIS) {
      const ops = getOperationsForApi(api.name);
      for (const op of ops) {
        const key = buildOperationKey(serviceName, api.name, op.method, op.urlTemplate);
        if (!allowlist.some(e => e.operationKey === key)) {
          blocked.push({
            operationKey: key,
            serviceName, apiName: api.name, apiDisplayName: api.displayName,
            apiPath: api.path, operationName: op.name, operationDisplayName: op.displayName,
            method: op.method, urlTemplate: op.urlTemplate, state: "Blocked",
          });
        }
      }
    }
    return blocked;
  },

  // Unblock
  async unblock(items: { serviceName: string; apiName: string; method: string; urlTemplate: string; gatewayId?: string }[]): Promise<void> {
    await delay(400);
    for (const item of items) {
      const key = buildOperationKey(item.serviceName, item.apiName, item.method, item.urlTemplate);
      if (!allowlist.some(e => e.operationKey === key)) {
        allowlist.push({ operationKey: key, scope: item.gatewayId ? { gatewayId: item.gatewayId } : undefined });
      }
    }
  },

  // Block
  async block(items: { serviceName: string; apiName: string; method: string; urlTemplate: string; gatewayId?: string }[]): Promise<void> {
    await delay(400);
    for (const item of items) {
      const key = buildOperationKey(item.serviceName, item.apiName, item.method, item.urlTemplate);
      allowlist = allowlist.filter(e => e.operationKey !== key);
    }
  },

  // Bulk by tag
  async bulkByTag(serviceName: string, tagNames: string[], action: "block" | "unblock", gatewayId?: string): Promise<number> {
    await delay(600);
    let count = 0;
    const matchingApis = APIS.filter(a => a.tags.some(t => tagNames.includes(t)));
    const items: { serviceName: string; apiName: string; method: string; urlTemplate: string; gatewayId?: string }[] = [];
    for (const api of matchingApis) {
      const ops = getOperationsForApi(api.name);
      for (const op of ops) {
        items.push({ serviceName, apiName: api.name, method: op.method, urlTemplate: op.urlTemplate, gatewayId });
        count++;
      }
    }
    if (action === "unblock") await this.unblock(items);
    else await this.block(items);
    return count;
  },

  // Allowlist raw
  getAllowlist(): AllowlistEntry[] {
    return [...allowlist];
  },

  // Policy mode
  getPolicyMode(): PolicyMode { return policyMode; },
  setPolicyMode(mode: PolicyMode) { policyMode = mode; },
};
