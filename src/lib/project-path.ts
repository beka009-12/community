import type { ProjectStatus } from "./api-enums";
import { PROJECT_STATUS_LABELS } from "./api-labels";

export type StageState = "done" | "current" | "todo";

export interface PathStage {
  status: ProjectStatus;
  label: string;
  state: StageState;
}

// A project's life as a path; a paused project has stepped off it.
const STAGES: ProjectStatus[] = ["Planned", "In_progress", "Completed"];

export function projectPath(status: ProjectStatus): PathStage[] | null {
  const current = STAGES.indexOf(status);
  if (current === -1) return null;
  return STAGES.map((stage, index) => ({
    status: stage,
    label: PROJECT_STATUS_LABELS[stage],
    state: index < current ? "done" : index === current ? "current" : "todo",
  }));
}

// Which slide a horizontal scroll-snap track rests on; `step` is one slide
// plus the gap.
export function slideIndex(scrollLeft: number, step: number, count: number): number {
  if (step <= 0 || count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / step)));
}
