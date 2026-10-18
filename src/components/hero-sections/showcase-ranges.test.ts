import { describe, expect, it } from "vitest";
import { plateRanges } from "./showcase-ranges";

describe("plateRanges", () => {
  it("keeps the first plate in place and covers it over the first segment", () => {
    expect(plateRanges(0, 4)).toEqual({ enter: null, cover: [0, 0.25] });
  });

  it("slides a middle plate in over the previous segment and covers it over its own", () => {
    expect(plateRanges(2, 4)).toEqual({ enter: [0.25, 0.5], cover: [0.5, 0.75] });
  });

  it("never covers the last plate", () => {
    expect(plateRanges(4, 4)).toEqual({ enter: [0.75, 1], cover: null });
  });

  it("holds a single plate still", () => {
    expect(plateRanges(0, 0)).toEqual({ enter: null, cover: null });
  });

  it("only produces offsets inside 0–1", () => {
    for (let index = 0; index <= 5; index++) {
      const { enter, cover } = plateRanges(index, 5);
      for (const offset of [...(enter ?? []), ...(cover ?? [])]) {
        expect(offset).toBeGreaterThanOrEqual(0);
        expect(offset).toBeLessThanOrEqual(1);
      }
    }
  });
});
