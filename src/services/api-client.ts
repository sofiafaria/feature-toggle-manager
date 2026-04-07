import type {
  Api,
  Operation,
  AppContextDef,
  BlockedOperation,
  ToggleState,
  AuditRecord,
  AllowlistEntry,
} from "@/types/domain";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const apiClient = {
  // Auth
  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  // Contexts
  getContexts(): AppContextDef[] {
    // This is called synchronously in the current code, so we need an async variant too
    throw new Error("Use getContextsAsync for real API");
  },

  async getContextsAsync(): Promise<AppContextDef[]> {
    return request("/contexts");
  },

  // APIs
  async getApis(search?: string): Promise<Api[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    return request(`/apis${params}`);
  },

  // Operations
  async getOperations(apiName: string): Promise<Operation[]> {
    return request(`/apis/${encodeURIComponent(apiName)}/operations`);
  },

  // Tags
  async getTags(): Promise<string[]> {
    return request("/tags");
  },

  // State check
  getToggleState(
    serviceName: string,
    apiName: string,
    method: string,
    urlTemplate: string,
    contextId: string
  ): ToggleState {
    throw new Error("Use getToggleStateAsync for real API");
  },

  async getToggleStateAsync(
    serviceName: string,
    apiName: string,
    method: string,
    urlTemplate: string,
    contextId: string
  ): Promise<ToggleState> {
    const params = new URLSearchParams({
      service: serviceName,
      api: apiName,
      method,
      url: urlTemplate,
      contextId,
    });
    const result = await request<{ allowed: boolean }>(`/toggles/check?${params}`);
    return result.allowed ? "Unblocked" : "Blocked";
  },

  // Blocked operations
  async getBlockedOperations(serviceName: string, contextId: string): Promise<BlockedOperation[]> {
    const params = new URLSearchParams({ service: serviceName, contextId });
    return request(`/toggles/blocked?${params}`);
  },

  // Unblock
  async unblock(
    items: { serviceName: string; apiName: string; method: string; urlTemplate: string }[],
    contextId: string,
    user: string,
    contextDisplayName: string
  ): Promise<void> {
    return request("/toggles/unblock", {
      method: "POST",
      body: JSON.stringify({ items, contextId, user, contextDisplayName }),
    });
  },

  // Block
  async block(
    items: { serviceName: string; apiName: string; method: string; urlTemplate: string }[],
    contextId: string,
    user: string,
    contextDisplayName: string
  ): Promise<void> {
    return request("/toggles/block", {
      method: "POST",
      body: JSON.stringify({ items, contextId, user, contextDisplayName }),
    });
  },

  // Bulk by tag
  async bulkByTag(
    serviceName: string,
    tagNames: string[],
    action: "block" | "unblock",
    contextId: string,
    user: string,
    contextDisplayName: string
  ): Promise<number> {
    const result = await request<{ count: number }>("/toggles/bulk-by-tag", {
      method: "POST",
      body: JSON.stringify({ serviceName, tagNames, action, contextId, user, contextDisplayName }),
    });
    return result.count;
  },

  // Allowlist raw
  getAllowlist(): AllowlistEntry[] {
    throw new Error("Use getAllowlistAsync for real API");
  },

  async getAllowlistAsync(): Promise<AllowlistEntry[]> {
    return request("/allowlist");
  },

  // Context endpoints
  getContextEndpoint(contextId: string): string {
    throw new Error("Use getContextEndpointAsync for real API");
  },

  async getContextEndpointAsync(contextId: string): Promise<string> {
    const result = await request<{ url: string }>(`/contexts/${encodeURIComponent(contextId)}/endpoint`);
    return result.url;
  },

  updateContextEndpoint(contextId: string, url: string, user: string, contextDisplayName: string) {
    return request(`/contexts/${encodeURIComponent(contextId)}/endpoint`, {
      method: "PUT",
      body: JSON.stringify({ url, user, contextDisplayName }),
    });
  },

  async testConnection(url: string): Promise<{ success: boolean; error?: string }> {
    return request("/contexts/test-connection", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },

  // Audit
  logContextChange(user: string, contextDisplayName: string) {
    return request("/audit/context-change", {
      method: "POST",
      body: JSON.stringify({ user, contextDisplayName }),
    });
  },

  getAuditLog(): AuditRecord[] {
    throw new Error("Use getAuditLogAsync for real API");
  },

  async getAuditLogAsync(): Promise<AuditRecord[]> {
    return request("/audit");
  },
};
