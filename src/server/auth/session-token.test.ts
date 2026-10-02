import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "./session-token";

const secret = "test-secret-test-secret-test-secret";
const payload = { sub: "admin", role: "ADMIN" as const, exp: 2_000 };

describe("session token", () => {
  it("round-trips a valid token", async () => {
    const token = await signToken(payload, secret);
    expect(await verifyToken(token, secret, 1_000)).toEqual(payload);
  });

  it("rejects an expired token", async () => {
    const token = await signToken(payload, secret);
    expect(await verifyToken(token, secret, 3_000)).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const [, signature] = (await signToken(payload, secret)).split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...payload, exp: 9e15 }),
    ).toString("base64url");
    expect(await verifyToken(`${forged}.${signature}`, secret, 1_000)).toBeNull();
  });

  it("rejects another secret, garbage and a missing token", async () => {
    const foreign = await signToken(payload, "other-secret-other-secret");
    expect(await verifyToken(foreign, secret, 1_000)).toBeNull();
    expect(await verifyToken("abc", secret, 1_000)).toBeNull();
    expect(await verifyToken("a.b", secret, 1_000)).toBeNull();
    expect(await verifyToken(undefined, secret, 1_000)).toBeNull();
  });
});
