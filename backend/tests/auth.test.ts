import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("auth", () => {
  it("rejects bad credentials", async () => {
    const res = await request(app).post("/auth/login").send({ username: "x", password: "y" });
    expect(res.status).toBe(401);
  });

  it("accepts default admin credentials and sets cookie", async () => {
    const res = await request(app).post("/auth/login").send({ username: "admin", password: "admin" });
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/ftm_session=/);
  });

  it("rejects unauthenticated requests to protected routes", async () => {
    const res = await request(app).get("/contexts");
    expect(res.status).toBe(401);
  });
});
