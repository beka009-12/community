import { describe, expect, it } from "vitest";
import { parseClientRequest } from "./client-request";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

const valid = {
  name: "Айбек",
  email: "aibek@company.kg",
  title: "CRM для склада",
  description: "Нужна система учёта остатков на складе.",
};

describe("parseClientRequest", () => {
  it("accepts a valid request and drops empty optional fields", () => {
    const result = parseClientRequest(form({ ...valid, company: "", budget: "  " }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.company).toBeUndefined();
      expect(result.data.budget).toBeUndefined();
    }
  });

  it("returns field errors for a bad email and a too-short description", () => {
    const result = parseClientRequest(form({ ...valid, email: "nope", description: "кратко" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.description).toBeDefined();
    }
  });

  it("rejects an unknown project type", () => {
    const result = parseClientRequest(form({ ...valid, projectType: "rockets" }));
    expect(result.success).toBe(false);
  });
});
