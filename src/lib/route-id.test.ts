import { describe, expect, it } from "vitest";
import { parseId } from "./route-id";

describe("parseId", () => {
  it("accepts positive integers", () => {
    expect(parseId("12")).toBe(12);
  });

  it.each(["0", "-1", "abc", "1.5", "", "01", "99999999999"])("rejects %j", (value) => {
    expect(parseId(value)).toBeNull();
  });
});
