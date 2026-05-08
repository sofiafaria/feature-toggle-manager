import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock redis to avoid needing a server in unit tests
vi.mock("../src/services/redis.js", () => {
  const store = new Map<string, Map<string, string>>();
  const key = (c: string, s: string) => `${c}:${s}`;
  return {
    setContextEndpoint: vi.fn(),
    getContextEndpoint: vi.fn(() => "redis://localhost:6379"),
    pingUrl: vi.fn(async () => ({ success: true })),
    getRedis: vi.fn(),
    RedisRepo: {
      block: vi.fn(async (c: string, s: string, k: string) => {
        if (!store.has(key(c, s))) store.set(key(c, s), new Map());
        store.get(key(c, s))!.set(k, "Blocked");
      }),
      unblock: vi.fn(async (c: string, s: string, k: string) => {
        store.get(key(c, s))?.delete(k);
      }),
      listBlocked: vi.fn(async (c: string, s: string) => {
        const m = store.get(key(c, s));
        return m ? Object.fromEntries(m) : {};
      }),
      isBlocked: vi.fn(async (c: string, s: string, k: string) =>
        store.get(key(c, s))?.get(k) === "Blocked",
      ),
      hashKey: (c: string, s: string) => `toggle:${c}:${s}`,
      __store: store,
    },
  };
});

vi.mock("../src/services/audit.js", () => ({
  appendAudit: vi.fn(async (r: unknown) => ({ id: "x", timestamp: "t", ...(r as object) })),
  readAudit: vi.fn(async () => []),
}));

const { createApp } = await import("../src/app.js");
const app = createApp();

async function login() {
  const res = await request(app).post("/auth/login").send({ username: "admin", password: "admin" });
  return res.headers["set-cookie"];
}

describe("toggles", () => {
  let cookie: string[] = [];
  beforeEach(async () => {
    cookie = (await login()) as unknown as string[];
  });

  it("blocks an operation and lists it", async () => {
    const item = { serviceName: "svc", apiName: "api1", method: "GET", urlTemplate: "/x" };
    const block = await request(app)
      .post("/toggles/block")
      .set("Cookie", cookie)
      .send({ items: [item], contextId: "dev-cloud", user: "admin", contextDisplayName: "DEV - Cloud" });
    expect(block.status).toBe(204);

    const list = await request(app)
      .get("/toggles/blocked?service=svc&contextId=dev-cloud")
      .set("Cookie", cookie);
    expect(list.status).toBe(200);
    expect(Object.keys(list.body)).toContain("svc:api1:GET:/x");
  });

  it("unblocks an operation", async () => {
    const item = { serviceName: "svc", apiName: "api1", method: "GET", urlTemplate: "/x" };
    await request(app).post("/toggles/block").set("Cookie", cookie).send({
      items: [item], contextId: "dev-cloud", user: "admin", contextDisplayName: "DEV - Cloud",
    });
    const res = await request(app).post("/toggles/unblock").set("Cookie", cookie).send({
      items: [item], contextId: "dev-cloud", user: "admin", contextDisplayName: "DEV - Cloud",
    });
    expect(res.status).toBe(204);
  });

  it("validates body", async () => {
    const res = await request(app).post("/toggles/block").set("Cookie", cookie).send({});
    expect(res.status).toBe(400);
  });
});
