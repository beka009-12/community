import { describe, expect, it } from "vitest";
import { generatePassword } from "./password";

describe("generatePassword", () => {
  it("makes 14 characters without look-alikes", () => {
    const password = generatePassword();
    expect(password).toHaveLength(14);
    expect(password).not.toMatch(/[01OlI]/);
  });

  it("differs between calls", () => {
    expect(generatePassword()).not.toBe(generatePassword());
  });
});
