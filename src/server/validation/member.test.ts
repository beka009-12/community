import { describe, expect, it } from "vitest";
import { parseMemberCreate, parseMemberUpdate } from "./member";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

const valid = {
  login: "new.dev",
  role: "DEVELOPER",
  firstName: "Айбек",
  lastName: "Садыков",
  specializationId: "frontend",
  roleTitle: "Frontend-разработчик",
  stack: "React",
  bio: "",
  skills: "React, TypeScript, ,",
  github: "",
};

describe("member validation", () => {
  it("parses skills from a comma list and drops blank links", () => {
    const result = parseMemberUpdate(form(valid));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toEqual(["React", "TypeScript"]);
      expect(result.data.github).toBeUndefined();
    }
  });

  it("rejects a login with spaces or cyrillic", () => {
    const result = parseMemberUpdate(form({ ...valid, login: "Новый юзер" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.login).toBeDefined();
  });

  it("requires an 8+ char password on create only", () => {
    expect(parseMemberCreate(form({ ...valid, password: "short" })).success).toBe(false);
    expect(parseMemberCreate(form({ ...valid, password: "long-enough" })).success).toBe(true);
  });

  it("rejects an unknown specialization and a non-url github", () => {
    const result = parseMemberUpdate(form({ ...valid, specializationId: "chef", github: "github" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.specializationId).toBeDefined();
      expect(result.fieldErrors.github).toBeDefined();
    }
  });
});
