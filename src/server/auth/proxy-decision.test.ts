import { describe, expect, it } from "vitest";
import { areaOf, decideAccess, needsRefresh } from "./proxy-decision";

describe("areaOf", () => {
  it.each([
    ["/admin", "admin"],
    ["/admin/members/3", "admin"],
    ["/administrator", "other"],
    ["/account", "account"],
    ["/login", "login"],
    ["/", "other"],
  ] as const)("%s → %s", (path, area) => {
    expect(areaOf(path)).toBe(area);
  });
});

describe("needsRefresh", () => {
  it("refreshes a missing or nearly expired access token", () => {
    expect(needsRefresh(null, 0)).toBe(true);
    expect(needsRefresh(10_000, 0)).toBe(true);
    expect(needsRefresh(60_000, 0)).toBe(false);
  });
});

describe("decideAccess", () => {
  it.each([
    ["admin", "Admin", true, "allow"],
    ["admin", "Developer", true, "login"],
    ["admin", "Admin", false, "login"],
    ["admin", null, false, "login"],
    ["account", "Team_Lead", true, "allow"],
    ["account", null, false, "login"],
    ["login", "Admin", true, "verify"],
    ["login", null, false, "allow"],
    ["other", null, false, "allow"],
  ] as const)("%s as %s (access: %s) → %s", (area, role, hasAccess, kind) => {
    expect(decideAccess(area, role, hasAccess).kind).toBe(kind);
  });
});
