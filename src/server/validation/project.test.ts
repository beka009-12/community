import { describe, expect, it } from "vitest";
import { parseProject } from "./project";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

const valid = {
  name: "Motion CRM",
  description: "Учёт клиентов и сделок для отдела продаж.",
  project_status: "In_progress",
  category: "Web",
  demo_url: "",
  github_url: "https://github.com/motion/crm",
};

describe("parseProject", () => {
  it("accepts API field names and turns blank URLs into null", () => {
    const result = parseProject(form(valid));
    expect(result.success && result.data).toEqual({ ...valid, demo_url: null });
  });

  it("rejects an unknown status, a blank category and a broken URL", () => {
    const result = parseProject(form({ ...valid, project_status: "DONE", category: " ", demo_url: "demo" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["category", "demo_url", "project_status"]);
    }
  });
});
