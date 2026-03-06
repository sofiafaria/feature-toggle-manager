export type EnvironmentId = "DEV" | "QA" | "PRD";

export interface Environment {
  id: EnvironmentId;
  displayName: string;
}

export interface ApimService {
  id: string;
  name: string;
  resourceGroup: string;
  region: string;
}

export interface Api {
  id: string;
  name: string;
  displayName: string;
  path: string;
  protocols: string[];
  tags: string[];
}

export interface Operation {
  id: string;
  name: string;
  displayName: string;
  method: string;
  urlTemplate: string;
  description?: string;
}

export type OperationKey = string; // "serviceName:apiName:method:urlTemplate"

export interface AllowlistEntry {
  operationKey: OperationKey;
  scope?: { gatewayId?: string };
}

export interface Gateway {
  id: string;
  name: string;
  location: string;
  type: "managed" | "selfHosted";
}

export type ToggleState = "Blocked" | "Unblocked";

export type PolicyMode = "BACKOFFICE_CHECK" | "APIM_NAMED_VALUE";

export interface BlockedOperation {
  operationKey: OperationKey;
  serviceName: string;
  apiName: string;
  apiDisplayName: string;
  apiPath: string;
  operationName: string;
  operationDisplayName: string;
  method: string;
  urlTemplate: string;
  state: ToggleState;
}

export interface AppContext {
  environmentId: EnvironmentId;
  serviceName: string;
  resourceGroup: string;
}

export function buildOperationKey(serviceName: string, apiName: string, method: string, urlTemplate: string): OperationKey {
  return `${serviceName}:${apiName}:${method}:${urlTemplate}`;
}

export function formatOperationDisplay(apiDisplayName: string, opDisplayName: string, method: string, apiPath: string, urlTemplate: string): string {
  return `${apiDisplayName} → ${opDisplayName} (${method} ${apiPath}${urlTemplate})`;
}
