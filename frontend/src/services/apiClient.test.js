import { describe, test, expect, vi, beforeEach } from "vitest";

const getIdToken = vi.fn(async () => "fake-token");
const signOut = vi.fn(async () => {});

vi.mock("../firebaseConfig", () => ({
  auth: { get currentUser() { return mockUser; } },
}));
vi.mock("firebase/auth", () => ({ signOut: (...a) => signOut(...a) }));

let mockUser = { getIdToken };

import { apiGet, apiPost } from "./apiClient";

beforeEach(() => {
  getIdToken.mockClear();
  signOut.mockClear();
  mockUser = { getIdToken };
});

describe("apiClient", () => {
  test("attaches a Bearer token and returns parsed JSON", async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ hello: "world" }),
    }));

    const data = await apiGet("/feed");
    expect(data).toEqual({ hello: "world" });

    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe("Bearer fake-token");
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });

  test("signs out and throws on 401", async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }));
    await expect(apiPost("/posts", { a: 1 })).rejects.toThrow();
    expect(signOut).toHaveBeenCalled();
  });

  test("throws when there is no authenticated user", async () => {
    mockUser = null;
    await expect(apiGet("/feed")).rejects.toThrow("Not authenticated");
  });
});
