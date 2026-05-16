const request = require("supertest");
const app = require("../server");

describe("API security & health", () => {
  test("GET /api/health is public and returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test.each([
    ["get", "/api/feed"],
    ["post", "/api/posts"],
    ["get", "/api/search/users?q=a"],
    ["post", "/api/follow"],
    ["get", "/api/messages/conversations"],
    ["get", "/api/recommendations/people"],
    ["put", "/api/profile/someone"],
  ])("%s %s requires auth (401 without token)", async (method, path) => {
    const res = await request(app)[method](path).send({});
    expect(res.status).toBe(401);
  });

  test("rejects a malformed bearer token", async () => {
    const res = await request(app)
      .get("/api/feed")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});
