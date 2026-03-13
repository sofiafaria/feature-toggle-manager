export type EnvironmentId = "DEV" | "QA" | "PRE" | "PRD";

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

export type OperationKey = string;

export interface AllowlistEntry {
  operationKey: OperationKey;
  contextId: string;
}

export interface Gateway {
  id: string;
  name: string;
  location: string;
  type: "managed" | "selfHosted";
}

export type ToggleState = "Blocked" | "Unblocked";

export interface AppContextDef {
  id: string;
  displayName: string;
  environmentId: EnvironmentId;
  environmentName: string;
  gatewayType: "SelfHost" | "Cloud";
  endpointUrl: string;
}

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

export type AuditActionType =
  | "BLOCK"
  | "UNBLOCK"
  | "BULK_BLOCK"
  | "BULK_UNBLOCK"
  | "SETTINGS_UPDATE"
  | "CONTEXT_CHANGE";

export type AuditResult = "Success" | "Failure";

export interface AuditRecord {
  id: string;
  user: string;
  timestamp: string; // ISO UTC
  actionType: AuditActionType;
  contextDisplayName: string;
  target: string;
  result: AuditResult;
}

export function buildOperationKey(serviceName: string, apiName: string, method: string, urlTemplate: string): OperationKey {
  return `${serviceName}:${apiName}:${method}:${urlTemplate}`;
}

export function formatOperationDisplay(apiDisplayName: string, opDisplayName: string, method: string, apiPath: string, urlTemplate: string): string {
  return `${apiDisplayName} → ${opDisplayName} (${method} ${apiPath}${urlTemplate})`;
}
