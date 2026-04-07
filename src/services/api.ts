/**
 * API Facade
 *
 * When VITE_API_BASE_URL is set, the real HTTP client is used.
 * Otherwise, the in-memory mock API is used (default for local dev).
 */
import { mockApi } from "@/mock/api-service";
import { apiClient } from "./api-client";

const isRealApi = !!import.meta.env.VITE_API_BASE_URL;

export const api = isRealApi ? apiClient : mockApi;

export { isRealApi };
