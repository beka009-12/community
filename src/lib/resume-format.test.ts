import { describe, expect, it } from "vitest";
import { formatDay, formatMonth, formatPeriod, formatYears, newestFirst } from "./resume-format";

describe("resume format", () => {
  it("formats months and days without time-zone drift", () => {
    expect(formatMonth("2024-01-01")).toBe("янв 2024");
    expect(formatDay("2025-03-09")).toBe("9 мар 2025");
  });

  it("shows open periods as ongoing", () => {
    expect(formatPeriod("2024-01-15", null)).toBe("янв 2024 — сейчас");
    expect(formatPeriod("2022-05-01", "2023-12-31")).toBe("май 2022 — дек 2023");
  });

  it("shows study years, or that they still study", () => {
    expect(formatYears("2019-09-01", "2023-06-30", false)).toBe("2019 — 2023");
    expect(formatYears("2021-09-01", null, true)).toBe("2021 — учусь");
  });

  it("returns a value it can't read as is", () => {
    expect(formatMonth("скоро")).toBe("скоро");
  });

  it("sorts newest first without touching the input", () => {
    const rows = [{ at: "2020-01-01" }, { at: "2024-01-01" }, { at: "2022-01-01" }];
    expect(newestFirst(rows, (item) => item.at).map((item) => item.at)).toEqual([
      "2024-01-01",
      "2022-01-01",
      "2020-01-01",
    ]);
    expect(rows[0].at).toBe("2020-01-01");
  });
});
