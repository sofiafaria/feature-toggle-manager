import { ApiManagementClient } from "@azure/arm-apimanagement";
import { DefaultAzureCredential } from "@azure/identity";
import { config } from "../config.js";
import type { Api, Operation } from "../types.js";

let client: ApiManagementClient | null = null;
function getClient(): ApiManagementClient {
  if (!client) {
    client = new ApiManagementClient(new DefaultAzureCredential(), config.apim.subscriptionId);
  }
  return client;
}

export const ApimService = {
  async listApis(search?: string): Promise<Api[]> {
    const c = getClient();
    const out: Api[] = [];
    for await (const a of c.api.listByService(config.apim.resourceGroup, config.apim.serviceName)) {
      out.push({
        id: a.id ?? "",
        name: a.name ?? "",
        displayName: a.displayName ?? a.name ?? "",
        path: a.path ?? "",
        protocols: a.protocols ?? [],
        tags: [], // tags loaded lazily; see listTags
      });
    }
    if (search) {
      const q = search.toLowerCase();
      return out.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.displayName.toLowerCase().includes(q) ||
          a.path.toLowerCase().includes(q),
      );
    }
    return out;
  },

  async listOperations(apiName: string): Promise<Operation[]> {
    const c = getClient();
    const out: Operation[] = [];
    for await (const o of c.apiOperation.listByApi(
      config.apim.resourceGroup,
      config.apim.serviceName,
      apiName,
    )) {
      out.push({
        id: o.id ?? "",
        name: o.name ?? "",
        displayName: o.displayName ?? o.name ?? "",
        method: o.method ?? "",
        urlTemplate: o.urlTemplate ?? "",
        description: o.description,
      });
    }
    return out;
  },

  async listTags(): Promise<string[]> {
    const c = getClient();
    const out = new Set<string>();
    for await (const t of c.tag.listByService(config.apim.resourceGroup, config.apim.serviceName)) {
      if (t.displayName) out.add(t.displayName);
    }
    return [...out];
  },

  async listOperationsByTag(serviceName: string, tagNames: string[]): Promise<
    { apiName: string; method: string; urlTemplate: string }[]
  > {
    const c = getClient();
    const out: { apiName: string; method: string; urlTemplate: string }[] = [];
    const target = new Set(tagNames.map((t) => t.toLowerCase()));
    for await (const a of c.api.listByService(config.apim.resourceGroup, config.apim.serviceName)) {
      const apiName = a.name ?? "";
      if (!apiName) continue;
      for await (const op of c.apiOperation.listByApi(
        config.apim.resourceGroup,
        config.apim.serviceName,
        apiName,
      )) {
        const opTags: string[] = [];
        try {
          for await (const t of c.tag.listByOperation(
            config.apim.resourceGroup,
            config.apim.serviceName,
            apiName,
            op.name ?? "",
          )) {
            if (t.displayName) opTags.push(t.displayName.toLowerCase());
          }
        } catch {
          /* ignore */
        }
        if (opTags.some((t) => target.has(t))) {
          out.push({
            apiName,
            method: op.method ?? "",
            urlTemplate: op.urlTemplate ?? "",
          });
        }
      }
    }
    return out;
  },
};
