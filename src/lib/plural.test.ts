import { describe, expect, it } from "vitest";
import { plural } from "./plural";

describe("plural", () => {
  it.each([
    [1, "проект"],
    [2, "проекта"],
    [5, "проектов"],
    [11, "проектов"],
    [21, "проект"],
    [22, "проекта"],
    [112, "проектов"],
  ] as const)("%i → %s", (count, word) => {
    expect(plural(count, "проект", "проекта", "проектов")).toBe(word);
  });
});
