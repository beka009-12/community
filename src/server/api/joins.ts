import type { MembershipRole } from "@/src/lib/api-enums";
import type { MemberListItem, Membership, ProjectDetail } from "./schemas";

export interface TeamPerson {
  member: MemberListItem;
  role: MembershipRole;
}

export interface ProjectTeam {
  project: ProjectDetail;
  people: TeamPerson[];
}

// Memberships carry user ids only; names and avatars come from the roster.
// Leads first; people missing from the roster (inactive) are dropped.
export function withPeople(memberships: Membership[], roster: MemberListItem[]): TeamPerson[] {
  const byId = new Map(roster.map((member) => [member.id, member]));
  return memberships
    .flatMap((row) => {
      const member = byId.get(row.user);
      return member ? [{ member, role: row.role }] : [];
    })
    .sort((a, b) => Number(b.role === "Team_Lead") - Number(a.role === "Team_Lead"));
}

export const hasLead = (project: ProjectDetail): boolean =>
  project.members.some((row) => row.role === "Team_Lead");

export const projectsWithoutLead = (projects: ProjectDetail[]): ProjectDetail[] =>
  projects.filter((project) => project.project_status !== "Completed" && !hasLead(project));

export function idleMembers(roster: MemberListItem[], projects: ProjectDetail[]): MemberListItem[] {
  const busy = new Set(projects.flatMap((project) => project.members.map((row) => row.user)));
  return roster.filter((member) => member.status === "Active" && !busy.has(member.id));
}

export const projectTeams = (projects: ProjectDetail[], roster: MemberListItem[]): ProjectTeam[] =>
  projects
    .map((project) => ({ project, people: withPeople(project.members, roster) }))
    .filter((team) => team.people.length > 0);

// `skills` is free text in the API: "React, TypeScript" or one per line.
export const splitSkills = (skills: string): string[] => [
  ...new Set(
    skills
      .split(/[,\n]/)
      .map((skill) => skill.trim())
      .filter(Boolean),
  ),
];
