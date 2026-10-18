export type Range = [number, number];

export interface PlateRanges {
  // Scroll progress over which the plate slides in; null: already in place.
  enter: Range | null;
  // Scroll progress over which the next plate covers it; null: never covered.
  cover: Range | null;
}

// One segment of scroll progress per transition, `steps` = plates - 1.
// Motion runs scroll-linked transforms as native animations, which reject
// offsets outside 0–1, so a plate with no segment on one side gets null
// instead of an out-of-range one.
const segment = (index: number, steps: number): Range | null =>
  index >= 0 && index < steps ? [index / steps, (index + 1) / steps] : null;

export const plateRanges = (index: number, steps: number): PlateRanges => ({
  enter: segment(index - 1, steps),
  cover: segment(index, steps),
});
