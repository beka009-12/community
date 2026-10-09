import { describe, expect, it } from "vitest";
import { parseMemberCreate, parseMemberProfile } from "./member";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

const profile = {
  login: "anvar",
  first_name: "Анвар",
  last_name: "Касымов",
  position: "",
  bio: "",
  skills: "React, Next.js",
  github: "",
  linkedin: "https://linkedin.com/in/anvar",
  portfolio: "",
};

describe("member validation", () => {
  it("creates with login, password and role only", () => {
    const result = parseMemberCreate(form({ login: " Anvar.K ", password: "secret-123", role: "Team_Lead" }));
    expect(result.success && result.data).toEqual({ login: "anvar.k", password: "secret-123", role: "Team_Lead" });
  });

  it("rejects a bad login, a short password and an unknown role", () => {
    const result = parseMemberCreate(form({ login: "a b", password: "123", role: "Owner" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["login", "password", "role"]);
    }
  });

  it("parses the profile with null URLs and no position", () => {
    const result = parseMemberProfile(form(profile));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBeUndefined();
      expect(result.data.github).toBeNull();
      expect(result.data.linkedin).toBe("https://linkedin.com/in/anvar");
    }
  });

  it("rejects an unknown position and a broken URL", () => {
    const result = parseMemberProfile(form({ ...profile, position: "Chef", github: "github" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.position).toBeDefined();
      expect(result.fieldErrors.github).toBeDefined();
    }
  });
});
