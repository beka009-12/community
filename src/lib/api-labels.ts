import type {
  MembershipRole,
  Position,
  ProjectStatus,
  RequestStatus,
  UserRole,
  UserStatus,
  WorkingFormat,
} from "./api-enums";

// Modifier suffixes shared by the public status pills (`status--<tone>`)
// and the admin StatusBadge.
export type Tone = "positive" | "accent" | "neutral" | "muted" | "danger";

export const POSITION_LABELS: Record<Position, string> = {
  Frontend_Developer: "Frontend Developer",
  Backend_Developer: "Backend Developer",
  Fullstack_Developer: "Fullstack Developer",
  "UI/UX_Designer": "UI/UX Designer",
  QA_Engineer: "QA Engineer",
  Mobile_Developer: "Mobile Developer",
};

// Fresh accounts can have no position yet.
export const positionLabel = (position: Position | null): string | null =>
  position ? POSITION_LABELS[position] : null;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  Planned: "В планах",
  In_progress: "В разработке",
  Completed: "Готово",
  Paused: "На паузе",
};

export const PROJECT_STATUS_TONE: Record<ProjectStatus, Tone> = {
  Planned: "neutral",
  In_progress: "accent",
  Completed: "positive",
  Paused: "muted",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  Admin: "Админ",
  Team_Lead: "Тимлид",
  Developer: "Разработчик",
};

export const MEMBERSHIP_ROLE_LABELS: Record<MembershipRole, string> = {
  Team_Lead: "Тимлид",
  Developer: "Разработчик",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  Active: "Активен",
  Inactive: "Неактивен",
};

export const USER_STATUS_TONE: Record<UserStatus, Tone> = {
  Active: "positive",
  Inactive: "muted",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  New: "Новая",
  Reviewing: "На рассмотрении",
};

export const REQUEST_STATUS_TONE: Record<RequestStatus, Tone> = {
  New: "accent",
  Reviewing: "neutral",
};

export const WORKING_FORMAT_LABELS: Record<WorkingFormat, string> = {
  office: "Офис",
  remote: "Удалённо",
  hybrid: "Гибрид",
  freelance: "Фриланс",
  part_time: "Частичная занятость",
  full_time: "Полная занятость",
  contract: "Контракт",
  internship: "Стажировка",
  flexible: "Гибкий график",
};
