/**
 * API Facade
 *
 * When VITE_API_BASE_URL is set, the real HTTP client is used.
 * Otherwise, the in-memory mock API is used (default for local dev).
 */
import { mockApi } from "@/mock/api-service";
import { apiClient } from "./api-client";

const isRealApi = !!import.meta.env.VITE_API_BASE_URL;

const isRealApiRedis = !!import.meta.env.VITE_REDIS_API_BASE_URL;

export const api = isRealApi ? apiClient : mockApi;

export const apiRedis = isRealApiRedis ? apiClient : mockApi;

console.log(`Using ${isRealApi ? "real" : "mock"} API`);
console.log(`Using ${isRealApiRedis ? "real" : "mock"} Redis API`);

export { isRealApi, isRealApiRedis };