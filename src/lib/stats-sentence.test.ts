import { describe, expect, it } from "vitest";
import { statsSentence } from "./stats-sentence";

const stats = (members_count: number, projects_count: number, companies_count: number) => ({
  members_count,
  projects_count,
  companies_count,
});

describe("statsSentence", () => {
  it("reads as one sentence about members and products, then companies", () => {
    expect(statsSentence(stats(12, 5, 4))).toEqual([
      12,
      " участников строят ",
      5,
      " собственных продуктов. ",
      4,
      " компании уже работают с нами.",
    ]);
  });

  it("agrees nouns and verbs with singular counts", () => {
    expect(statsSentence(stats(21, 1, 1))).toEqual([
      21,
      " участник строит ",
      1,
      " собственный продукт. ",
      1,
      " компания уже работает с нами.",
    ]);
  });

  it("uses the few-form for 2–4", () => {
    expect(statsSentence(stats(3, 2, 22))).toEqual([
      3,
      " участника строят ",
      2,
      " собственных продукта. ",
      22,
      " компании уже работают с нами.",
    ]);
  });

  it("drops the companies sentence when there are none", () => {
    expect(statsSentence(stats(12, 5, 0))).toEqual([12, " участников строят ", 5, " собственных продуктов."]);
  });

  it("speaks only about members when there are no products yet", () => {
    expect(statsSentence(stats(12, 0, 0))).toEqual([12, " участников в сообществе."]);
  });

  it("says nothing without members", () => {
    expect(statsSentence(stats(0, 5, 4))).toEqual([]);
  });
});
