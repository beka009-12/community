import { describe, expect, it } from "vitest";
import { parseRequestStatus } from "./request-status";

const form = (status: string) => {
  const data = new FormData();
  data.set("status", status);
  return data;
};

describe("request status validation", () => {
  it("accepts a known status", () => {
    expect(parseRequestStatus(form("ACCEPTED")).success).toBe(true);
  });

  it("rejects an unknown status", () => {
    const result = parseRequestStatus(form("ARCHIVED"));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.status).toBeDefined();
  });
});
