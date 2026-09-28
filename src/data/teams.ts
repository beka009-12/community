import { MEMBERS } from "./members";

export interface Team {
  id: string;
  projectSlug: string;
  projectName: string;
  memberIds: string[];
}

// Teams reference members by id instead of re-describing people —
// same placeholder roster as the Участники roster, just grouped by
// project. A member can appear on more than one team (lead here,
// developer there), matching the platform spec's own rule: "Role
// пользователя ≠ его роль в конкретном проекте." Project slugs/names
// match src/data/projects.ts exactly.
// Every team includes exactly one "Тимлид ..." member — Teams.tsx shows
// only the lead's role/stack, so a pairing with no lead would silently
// fall back to whoever's listed first.
export const TEAMS: Team[] = [
  { id: "amanat", projectSlug: "amanat", projectName: "Amanat", memberIds: ["frontend-lead", "backend-dev"] },
  { id: "ibo", projectSlug: "ibo", projectName: "IBO", memberIds: ["backend-lead", "frontend-dev"] },
  { id: "tabel", projectSlug: "tabel", projectName: "Tabel", memberIds: ["ai-lead", "frontend-dev"] },
  { id: "vitrina", projectSlug: "vitrina", projectName: "Vitrina", memberIds: ["frontend-lead", "backend-dev"] },
  { id: "karta", projectSlug: "karta", projectName: "Karta", memberIds: ["backend-lead", "frontend-dev"] },
  { id: "salamat", projectSlug: "salamat", projectName: "Salamat", memberIds: ["ai-lead", "backend-dev"] },
];

export function getTeamMembers(team: Team) {
  return team.memberIds
    .map((id) => MEMBERS.find((member) => member.id === id))
    .filter((member): member is (typeof MEMBERS)[number] => Boolean(member));
}
