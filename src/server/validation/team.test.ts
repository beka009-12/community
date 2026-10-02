import { describe, expect, it } from "vitest";
import { parseMembership, parseTeam } from "./team";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

describe("team validation", () => {
  it("requires a 2+ char name", () => {
    expect(parseTeam(form({ name: "A", description: "" })).success).toBe(false);
    expect(parseTeam(form({ name: "Команда А", description: "" })).success).toBe(true);
  });

  it("requires a user and a known membership role", () => {
    expect(parseMembership(form({ userId: "", role: "DEVELOPER" })).success).toBe(false);
    expect(parseMembership(form({ userId: "qa-dev", role: "OWNER" })).success).toBe(false);
    expect(parseMembership(form({ userId: "qa-dev", role: "TEAM_LEAD" })).success).toBe(true);
  });
});
