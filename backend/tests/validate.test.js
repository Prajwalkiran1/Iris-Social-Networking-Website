const { validatePost, validateMessage, validateProfile } = require("../middleware/validate");

function run(mw, body) {
  const req = { body };
  let status = 200;
  let payload = null;
  let nexted = false;
  const res = {
    status(c) {
      status = c;
      return this;
    },
    json(p) {
      payload = p;
      return this;
    },
  };
  mw(req, res, () => {
    nexted = true;
  });
  return { status, payload, nexted };
}

describe("validatePost", () => {
  test("rejects empty content", () => {
    const r = run(validatePost, { content: "  " });
    expect(r.status).toBe(400);
    expect(r.nexted).toBe(false);
  });
  test("rejects over-long content", () => {
    const r = run(validatePost, { content: "x".repeat(5001) });
    expect(r.status).toBe(400);
  });
  test("accepts valid content", () => {
    const r = run(validatePost, { content: "hello" });
    expect(r.nexted).toBe(true);
  });
});

describe("validateMessage", () => {
  test("requires receiver and text", () => {
    expect(run(validateMessage, { text: "hi" }).status).toBe(400);
    expect(run(validateMessage, { receiver: "u1" }).status).toBe(400);
  });
  test("accepts valid message", () => {
    expect(run(validateMessage, { receiver: "u1", text: "hi" }).nexted).toBe(true);
  });
});

describe("validateProfile", () => {
  test("rejects non-array interests", () => {
    expect(run(validateProfile, { interests: "music" }).status).toBe(400);
  });
  test("accepts valid profile", () => {
    expect(
      run(validateProfile, { name: "Ann", bio: "hi", interests: ["music"] }).nexted
    ).toBe(true);
  });
  test("accepts empty body (all fields optional)", () => {
    expect(run(validateProfile, {}).nexted).toBe(true);
  });
});
