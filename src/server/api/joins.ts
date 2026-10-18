import type { MembershipRole } from "@/src/lib/api-enums";
import type { MemberListItem, Membership, ProjectDetail, TeamDetail } from "./schemas";

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

// Everyone who leads at least one project, once, in order of first appearance.
export function teamLeads(projects: ProjectDetail[], roster: MemberListItem[]): MemberListItem[] {
  const leads = new Map<number, MemberListItem>();
  for (const project of projects) {
    for (const { member, role } of withPeople(project.members, roster)) {
      if (role === "Team_Lead" && !leads.has(member.id)) leads.set(member.id, member);
    }
  }
  return [...leads.values()];
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

export interface MyProject {
  project: ProjectDetail;
  role: MembershipRole;
}

export interface MyTeam {
  team: TeamDetail;
  role: MembershipRole;
}

const roleOf = (members: Membership[], userId: number): MembershipRole | null =>
  members.find((row) => row.user === userId)?.role ?? null;

// From the full member lists, so it also works for an Admin, who has no
// public profile with a project list.
export const myProjects = (projects: ProjectDetail[], userId: number): MyProject[] =>
  projects.flatMap((project) => {
    const role = roleOf(project.members, userId);
    return role ? [{ project, role }] : [];
  });

export const myTeams = (teams: TeamDetail[], userId: number): MyTeam[] =>
  teams.flatMap((team) => {
    const role = roleOf(team.members, userId);
    return role ? [{ team, role }] : [];
  });
