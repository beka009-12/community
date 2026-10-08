// Enum values exactly as the Django API sends them
// (Swagger docs at API_URL + /docs/). Shared by server and client code.

export const POSITIONS = [
  "Frontend_Developer",
  "Backend_Developer",
  "Fullstack_Developer",
  "UI/UX_Designer",
  "QA_Engineer",
  "Mobile_Developer",
] as const;
export type Position = (typeof POSITIONS)[number];

export const PROJECT_STATUSES = ["Planned", "In_progress", "Completed", "Paused"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const USER_ROLES = ["Admin", "Team_Lead", "Developer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MEMBERSHIP_ROLES = ["Team_Lead", "Developer"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const USER_STATUSES = ["Active", "Inactive"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const REQUEST_STATUSES = ["New", "Reviewing"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
