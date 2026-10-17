import { describe, expect, it } from "vitest";
import { parseMembership } from "./membership";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

describe("parseMembership", () => {
  it("reads the user id as a number", () => {
    const result = parseMembership(form({ user: "3", role: "Team_Lead" }));
    expect(result.success && result.data).toEqual({ user: 3, role: "Team_Lead" });
  });

  it("requires a user and a known role", () => {
    expect(parseMembership(form({ user: "", role: "Developer" })).success).toBe(false);
    expect(parseMembership(form({ user: "3", role: "OWNER" })).success).toBe(false);
  });
});
