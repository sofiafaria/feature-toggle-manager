import Redis from "ioredis";
import { config } from "../config.js";
import type { ToggleState } from "../types.js";

const clients = new Map<string, Redis>();
const overrides = new Map<string, string>();

export function setContextEndpoint(contextId: string, url: string) {
  overrides.set(contextId, url);
  // Drop cached client so the new URL is used on next call
  const c = clients.get(contextId);
  if (c) {
    c.disconnect();
    clients.delete(contextId);
  }
}

export function getContextEndpoint(contextId: string): string {
  return (
    overrides.get(contextId) ??
    config.redis.perContext[contextId] ??
    config.redis.defaultUrl
  );
}

export function getRedis(contextId: string): Redis {
  let c = clients.get(contextId);
  if (!c) {
    c = new Redis(getContextEndpoint(contextId), {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
    });
    clients.set(contextId, c);
  }
  return c;
}

export async function pingUrl(url: string): Promise<{ success: boolean; error?: string }> {
  const c = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
  try {
    await c.connect();
    const pong = await c.ping();
    return { success: pong === "PONG" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    c.disconnect();
  }
}

export const RedisRepo = {
  hashKey: (contextId: string, serviceName: string) =>
    `toggle:${contextId}:${serviceName}`,

  async block(contextId: string, serviceName: string, operationKey: string): Promise<void> {
    await getRedis(contextId).hset(RedisRepo.hashKey(contextId, serviceName), operationKey, "Blocked");
  },

  async unblock(contextId: string, serviceName: string, operationKey: string): Promise<void> {
    await getRedis(contextId).hdel(RedisRepo.hashKey(contextId, serviceName), operationKey);
  },

  async listBlocked(contextId: string, serviceName: string): Promise<Record<string, ToggleState>> {
    const map = await getRedis(contextId).hgetall(RedisRepo.hashKey(contextId, serviceName));
    const out: Record<string, ToggleState> = {};
    for (const [k, v] of Object.entries(map)) out[k] = v as ToggleState;
    return out;
  },

  async isBlocked(contextId: string, serviceName: string, operationKey: string): Promise<boolean> {
    const v = await getRedis(contextId).hget(RedisRepo.hashKey(contextId, serviceName), operationKey);
    return v === "Blocked";
  },
};
