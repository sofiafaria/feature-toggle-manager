import type { Environment, ApimService, Api, Operation, AllowlistEntry, Gateway } from "@/types/domain";
import { buildOperationKey } from "@/types/domain";

export const ENVIRONMENTS: Environment[] = [
  { id: "DEV", displayName: "Development" },
  { id: "QA", displayName: "Quality Assurance" },
  { id: "PRD", displayName: "Production" },
];

export const SERVICES: ApimService[] = [
  { id: "svc-1", name: "apim-contoso-dev", resourceGroup: "rg-apim-dev", region: "West Europe" },
  { id: "svc-2", name: "apim-contoso-qa", resourceGroup: "rg-apim-qa", region: "West Europe" },
  { id: "svc-3", name: "apim-contoso-prd", resourceGroup: "rg-apim-prd", region: "West Europe" },
];

export const APIS: Api[] = [
  { id: "api-1", name: "users-api", displayName: "Users API", path: "/users", protocols: ["https"], tags: ["core", "v2"] },
  { id: "api-2", name: "orders-api", displayName: "Orders API", path: "/orders", protocols: ["https"], tags: ["commerce", "v2"] },
  { id: "api-3", name: "products-api", displayName: "Products API", path: "/products", protocols: ["https"], tags: ["commerce", "v1"] },
  { id: "api-4", name: "payments-api", displayName: "Payments API", path: "/payments", protocols: ["https"], tags: ["finance", "v2"] },
  { id: "api-5", name: "notifications-api", displayName: "Notifications API", path: "/notifications", protocols: ["https"], tags: ["core", "v1"] },
  { id: "api-6", name: "analytics-api", displayName: "Analytics API", path: "/analytics", protocols: ["https"], tags: ["reporting"] },
  { id: "api-7", name: "inventory-api", displayName: "Inventory API", path: "/inventory", protocols: ["https"], tags: ["commerce", "v2"] },
  { id: "api-8", name: "auth-api", displayName: "Authentication API", path: "/auth", protocols: ["https"], tags: ["core", "v2"] },
];

const opTemplates: Record<string, { displayName: string; method: string; urlTemplate: string; description?: string }[]> = {
  "users-api": [
    { displayName: "List Users", method: "GET", urlTemplate: "/", description: "Retrieve all users" },
    { displayName: "Get User", method: "GET", urlTemplate: "/{id}" },
    { displayName: "Create User", method: "POST", urlTemplate: "/" },
    { displayName: "Update User", method: "PUT", urlTemplate: "/{id}" },
    { displayName: "Delete User", method: "DELETE", urlTemplate: "/{id}" },
  ],
  "orders-api": [
    { displayName: "List Orders", method: "GET", urlTemplate: "/" },
    { displayName: "Get Order", method: "GET", urlTemplate: "/{id}" },
    { displayName: "Create Order", method: "POST", urlTemplate: "/" },
    { displayName: "Cancel Order", method: "DELETE", urlTemplate: "/{id}" },
    { displayName: "Update Order Status", method: "PATCH", urlTemplate: "/{id}/status" },
  ],
  "products-api": [
    { displayName: "List Products", method: "GET", urlTemplate: "/" },
    { displayName: "Get Product", method: "GET", urlTemplate: "/{id}" },
    { displayName: "Create Product", method: "POST", urlTemplate: "/" },
    { displayName: "Update Product", method: "PUT", urlTemplate: "/{id}" },
    { displayName: "Delete Product", method: "DELETE", urlTemplate: "/{id}" },
    { displayName: "Search Products", method: "GET", urlTemplate: "/search" },
  ],
  "payments-api": [
    { displayName: "Process Payment", method: "POST", urlTemplate: "/" },
    { displayName: "Get Payment", method: "GET", urlTemplate: "/{id}" },
    { displayName: "Refund Payment", method: "POST", urlTemplate: "/{id}/refund" },
    { displayName: "List Payments", method: "GET", urlTemplate: "/" },
  ],
  "notifications-api": [
    { displayName: "Send Notification", method: "POST", urlTemplate: "/" },
    { displayName: "List Notifications", method: "GET", urlTemplate: "/" },
    { displayName: "Mark Read", method: "PATCH", urlTemplate: "/{id}/read" },
  ],
  "analytics-api": [
    { displayName: "Get Dashboard", method: "GET", urlTemplate: "/dashboard" },
    { displayName: "Get Report", method: "GET", urlTemplate: "/reports/{id}" },
    { displayName: "Export Data", method: "POST", urlTemplate: "/export" },
  ],
  "inventory-api": [
    { displayName: "Check Stock", method: "GET", urlTemplate: "/{productId}/stock" },
    { displayName: "Update Stock", method: "PUT", urlTemplate: "/{productId}/stock" },
    { displayName: "List Warehouses", method: "GET", urlTemplate: "/warehouses" },
  ],
  "auth-api": [
    { displayName: "Login", method: "POST", urlTemplate: "/login" },
    { displayName: "Register", method: "POST", urlTemplate: "/register" },
    { displayName: "Refresh Token", method: "POST", urlTemplate: "/refresh" },
    { displayName: "Logout", method: "POST", urlTemplate: "/logout" },
  ],
};

export function getOperationsForApi(apiName: string): Operation[] {
  const templates = opTemplates[apiName] || [];
  return templates.map((t, i) => ({
    id: `${apiName}-op-${i}`,
    name: t.displayName.toLowerCase().replace(/\s+/g, "-"),
    displayName: t.displayName,
    method: t.method,
    urlTemplate: t.urlTemplate,
    description: t.description,
  }));
}

// Default: most operations are blocked (not in allowlist). Seed a few as unblocked.
const defaultService = "apim-contoso-dev";
export const INITIAL_ALLOWLIST: AllowlistEntry[] = [
  { operationKey: buildOperationKey(defaultService, "users-api", "GET", "/") },
  { operationKey: buildOperationKey(defaultService, "users-api", "GET", "/{id}") },
  { operationKey: buildOperationKey(defaultService, "orders-api", "GET", "/") },
  { operationKey: buildOperationKey(defaultService, "products-api", "GET", "/") },
  { operationKey: buildOperationKey(defaultService, "products-api", "GET", "/{id}") },
  { operationKey: buildOperationKey(defaultService, "products-api", "GET", "/search") },
  { operationKey: buildOperationKey(defaultService, "auth-api", "POST", "/login") },
  { operationKey: buildOperationKey(defaultService, "auth-api", "POST", "/register") },
];

export const GATEWAYS: Gateway[] = [
  { id: "gw-managed", name: "managed-gateway", location: "West Europe", type: "managed" },
  { id: "gw-onprem", name: "onprem-gateway-01", location: "On-Premises DC1", type: "selfHosted" },
  { id: "gw-edge", name: "edge-gateway-us", location: "East US", type: "selfHosted" },
];

export const ALL_TAGS = ["core", "commerce", "finance", "reporting", "v1", "v2"];
