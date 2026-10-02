import { describe, expect, it } from "vitest";
import { parseProjectCreate, parseProjectUpdate } from "./project";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

const valid = {
  name: "Склад",
  description: "Система учёта остатков на складе.",
  details: "",
  status: "PLANNED",
  category: "systems",
  origin: "client",
  year: "2026",
  image: "https://example.com/preview.png",
  stack: "React, NestJS",
  demoUrl: "",
  githubUrl: "",
};

describe("project validation", () => {
  it("parses stack, unchecked featured and blank links", () => {
    const result = parseProjectUpdate(form(valid));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stack).toEqual(["React", "NestJS"]);
      expect(result.data.featured).toBe(false);
      expect(result.data.demoUrl).toBeUndefined();
    }
  });

  it("treats a checked featured checkbox as true", () => {
    const result = parseProjectUpdate(form({ ...valid, featured: "on" }));
    expect(result.success && result.data.featured).toBe(true);
  });

  it("requires a url-safe slug on create", () => {
    expect(parseProjectCreate(form({ ...valid, id: "Мой проект" })).success).toBe(false);
    expect(parseProjectCreate(form({ ...valid, id: "sklad-2026" })).success).toBe(true);
  });

  it("rejects an unknown status and a bad year", () => {
    const result = parseProjectUpdate(form({ ...valid, status: "DONE", year: "26" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.status).toBeDefined();
      expect(result.fieldErrors.year).toBeDefined();
    }
  });
});
