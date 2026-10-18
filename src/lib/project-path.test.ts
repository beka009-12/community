import { describe, expect, it } from "vitest";
import { projectPath, slideIndex } from "./project-path";

const states = (status: Parameters<typeof projectPath>[0]) =>
  projectPath(status)?.map((stage) => `${stage.label}:${stage.state}`);

describe("projectPath", () => {
  it("starts a planned project at its first stage", () => {
    expect(states("Planned")).toEqual(["В планах:current", "В разработке:todo", "Готово:todo"]);
  });

  it("marks earlier stages done for a project in progress", () => {
    expect(states("In_progress")).toEqual(["В планах:done", "В разработке:current", "Готово:todo"]);
  });

  it("ends a completed project on its last stage", () => {
    expect(states("Completed")).toEqual(["В планах:done", "В разработке:done", "Готово:current"]);
  });

  it("has no path for a paused project", () => {
    expect(projectPath("Paused")).toBeNull();
  });
});

describe("slideIndex", () => {
  it("rounds the scroll offset to the nearest slide", () => {
    expect(slideIndex(0, 312, 5)).toBe(0);
    expect(slideIndex(170, 312, 5)).toBe(1);
    expect(slideIndex(624, 312, 5)).toBe(2);
  });

  it("stays within the slides when scrolled past either end", () => {
    expect(slideIndex(-40, 312, 5)).toBe(0);
    expect(slideIndex(5000, 312, 5)).toBe(4);
  });

  it("is the first slide when there is no step to measure", () => {
    expect(slideIndex(120, 0, 5)).toBe(0);
  });
});
