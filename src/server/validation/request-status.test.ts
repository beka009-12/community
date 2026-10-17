import { describe, expect, it } from "vitest";
import { parseRequestStatus } from "./request-status";

const form = (status: string) => {
  const data = new FormData();
  data.set("status", status);
  return data;
};

describe("parseRequestStatus", () => {
  it("accepts the two API statuses", () => {
    expect(parseRequestStatus(form("New")).success).toBe(true);
    expect(parseRequestStatus(form("Reviewing")).success).toBe(true);
  });

  it("rejects anything else, including the old pipeline statuses", () => {
    expect(parseRequestStatus(form("ACCEPTED")).success).toBe(false);
    expect(parseRequestStatus(form("")).success).toBe(false);
  });
});
