import { describe, expect, it } from "vitest";
import { generatePassword, hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("s3cret-pass");
    expect(hash).not.toContain("s3cret-pass");
    expect(await verifyPassword("s3cret-pass", hash)).toBe(true);
    expect(await verifyPassword("other", hash)).toBe(false);
  });

  it("rejects a malformed stored hash", async () => {
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });

  it("generates 14-char alphanumeric passwords", () => {
    expect(generatePassword()).toMatch(/^[A-Za-z0-9]{14}$/);
  });
});
