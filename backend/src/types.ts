export type EnvironmentId = "DEV" | "QA" | "PRE" | "PRD";
export type GatewayType = "SelfHost" | "Cloud";
export type ToggleState = "Blocked" | "Unblocked";

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

export interface AppContextDef {
  id: string;
  displayName: string;
  environmentId: EnvironmentId;
  environmentName: string;
  gatewayType: GatewayType;
  endpointUrl: string;
}

export interface BlockedOperation {
  operationKey: string;
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
  timestamp: string;
  actionType: AuditActionType;
  contextDisplayName: string;
  target: string;
  result: AuditResult;
}

export const buildOperationKey = (
  serviceName: string,
  apiName: string,
  method: string,
  urlTemplate: string,
) => `${serviceName}:${apiName}:${method}:${urlTemplate}`;
