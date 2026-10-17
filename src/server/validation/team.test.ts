import { describe, expect, it } from "vitest";
import { parseTeam } from "./team";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

describe("parseTeam", () => {
  it("requires a team_name of 2+ characters", () => {
    expect(parseTeam(form({ team_name: "A", description: "" })).success).toBe(false);
    expect(parseTeam(form({ team_name: "Команда А", description: "" })).success).toBe(true);
  });
});
