// Single source for the community numbers — shown in full on the homepage
// (hero-sections/Stats) and as one featured figure on the About hero
// (about-sections/Intro), so both stay in sync automatically.
export const STATS = [
  { id: "members", target: 120, suffix: "+", label: "участников" },
  { id: "projects", target: 15, suffix: "", label: "проектов" },
  { id: "hires", target: 8, suffix: "", label: "наймов" },
] as const;

export type StatId = (typeof STATS)[number]["id"];
