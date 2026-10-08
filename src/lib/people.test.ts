import { describe, expect, it } from "vitest";
import { fullName, initials } from "./people";

describe("fullName", () => {
  it("joins first and last name", () => {
    expect(fullName({ first_name: "Айгерим", last_name: "Токтогулова" })).toBe("Айгерим Токтогулова");
  });

  it("falls back when both parts are blank", () => {
    expect(fullName({ first_name: " ", last_name: "" }, "anvar")).toBe("anvar");
    expect(fullName({})).toBe("Участник");
  });
});

describe("initials", () => {
  it("takes the first letters of up to two words", () => {
    expect(initials("Айгерим Токтогулова")).toBe("АТ");
    expect(initials("anvar")).toBe("A");
    expect(initials("  ")).toBe("");
  });
});
