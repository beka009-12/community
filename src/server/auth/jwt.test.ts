import { describe, expect, it } from "vitest";
import { authCookieOptions } from "./cookies";
import { jwtExpiresAt } from "./jwt";
import { homeFor } from "./routes";

const jwt = (payload: object) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;

describe("jwtExpiresAt", () => {
  it("reads exp in milliseconds", () => {
    expect(jwtExpiresAt(jwt({ exp: 2_000_000_000, user_id: 3 }))).toBe(2_000_000_000_000);
  });

  it("returns null without exp or for garbage", () => {
    expect(jwtExpiresAt(jwt({ user_id: 3 }))).toBeNull();
    expect(jwtExpiresAt("not-a-jwt")).toBeNull();
    expect(jwtExpiresAt("a.%%%.c")).toBeNull();
  });
});

describe("authCookieOptions", () => {
  it("is httpOnly, lax, root-scoped and expires at the given time", () => {
    expect(authCookieOptions(1_000)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(1_000),
    });
  });
});

describe("homeFor", () => {
  it("sends admins to /admin and everyone else to /account", () => {
    expect(homeFor("Admin")).toBe("/admin");
    expect(homeFor("Team_Lead")).toBe("/account");
    expect(homeFor("Developer")).toBe("/account");
  });
});
