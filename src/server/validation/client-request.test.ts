import { describe, expect, it } from "vitest";
import { parseClientRequest } from "./client-request";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

const valid = {
  name: "Айбек",
  company: "Склад-Сервис",
  email: "aibek@company.kg",
  phone: "+996 555 123 456",
  title: "CRM для склада",
  description: "Нужна система учёта остатков на складе.",
  project_type: "Веб-системы",
  budget: "",
};

describe("parseClientRequest", () => {
  it("accepts a valid request and turns a blank budget into null", () => {
    const result = parseClientRequest(form(valid));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.budget).toBeNull();
  });

  it("reads the budget as a number of som", () => {
    const result = parseClientRequest(form({ ...valid, budget: "300 000" }));
    expect(result.success && result.data.budget).toBe(300000);
  });

  it("requires company and phone like the API", () => {
    const result = parseClientRequest(form({ ...valid, company: "", phone: " " }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.company).toBeDefined();
      expect(result.fieldErrors.phone).toBeDefined();
    }
  });

  it("flags a bad email, a short description and a non-numeric budget", () => {
    const result = parseClientRequest(
      form({ ...valid, email: "nope", description: "кратко", budget: "дорого" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["budget", "description", "email"]);
    }
  });

  it("only accepts the offered project types", () => {
    expect(parseClientRequest(form({ ...valid, project_type: "rockets" })).success).toBe(false);
    expect(parseClientRequest(form({ ...valid, project_type: "Другое" })).success).toBe(true);
  });
});
