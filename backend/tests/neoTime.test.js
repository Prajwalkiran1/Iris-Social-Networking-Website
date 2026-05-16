const { toIsoString } = require("../utils/neoTime");

// Guards the timezone bug: Neo4j datetime components must NOT be shifted by
// the server's local offset.
describe("toIsoString", () => {
  test("converts a Neo4j datetime object to correct UTC ISO", () => {
    const neoDt = {
      year: { low: 2026 },
      month: { low: 5 },
      day: { low: 16 },
      hour: { low: 10 },
      minute: { low: 21 },
      second: { low: 28 },
      nanosecond: { low: 537000000 },
      timeZoneOffsetSeconds: { low: 0 },
    };
    expect(toIsoString(neoDt)).toBe("2026-05-16T10:21:28.537Z");
  });

  test("applies a non-zero timezone offset", () => {
    const neoDt = {
      year: { low: 2026 },
      month: { low: 1 },
      day: { low: 1 },
      hour: { low: 5, low: 5 },
      minute: { low: 30 },
      second: { low: 0 },
      nanosecond: { low: 0 },
      timeZoneOffsetSeconds: { low: 19800 }, // +5:30
    };
    // 05:30 at +5:30 == 00:00 UTC
    expect(toIsoString(neoDt)).toBe("2026-01-01T00:00:00.000Z");
  });

  test("falls back to a valid ISO string for null", () => {
    expect(() => new Date(toIsoString(null)).toISOString()).not.toThrow();
  });

  test("passes through an ISO string", () => {
    expect(toIsoString("2026-05-16T10:00:00.000Z")).toBe(
      "2026-05-16T10:00:00.000Z"
    );
  });
});
