import "server-only";
import { randomBytes } from "node:crypto";
import { MEMBERS, isTeamLead } from "@/src/data/members";
import { PROJECTS } from "@/src/data/projects";
import { TEAMS } from "@/src/data/teams";
import { hashPassword } from "@/src/server/auth/password";
import type { Db, MembershipRole } from "./types";

const membershipRole = (userId: string): MembershipRole => {
  const member = MEMBERS.find((item) => item.id === userId);
  return member && isTeamLead(member) ? "TEAM_LEAD" : "DEVELOPER";
};

// First-run data, built from the src/data mocks the public site was
// designed against. Mock members get unusable random passwords — the
// admin resets one before anyone can log in as that member.
export async function buildSeed(): Promise<Db> {
  const now = new Date().toISOString();

  const users = await Promise.all(
    MEMBERS.map(async (member) => ({
      id: member.id,
      login: member.id,
      passwordHash: await hashPassword(randomBytes(24).toString("base64url")),
      role: isTeamLead(member) ? ("TEAM_LEAD" as const) : ("DEVELOPER" as const),
      status: member.status,
      createdAt: now,
    })),
  );

  const profiles = MEMBERS.map((member) => ({
    userId: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    photo: member.photo,
    bio: member.bio,
    specializationId: member.specializationId,
    roleTitle: member.role,
    stack: member.stack,
    skills: member.skills,
    github: member.github,
    linkedin: member.linkedin,
    portfolio: member.portfolio,
    resume: member.resume,
    experience: member.experience,
    education: member.education,
  }));

  const teams = TEAMS.map((team) => ({
    id: team.id,
    name: `Команда ${team.projectName}`,
    description: "",
    createdAt: now,
  }));

  const teamMembers = TEAMS.flatMap((team) =>
    team.memberIds.map((userId) => ({
      teamId: team.id,
      userId,
      role: membershipRole(userId),
    })),
  );

  const projectMembers = TEAMS.flatMap((team) =>
    team.memberIds.map((userId) => ({
      projectId: team.projectSlug,
      userId,
      role: membershipRole(userId),
    })),
  );

  const projects = PROJECTS.map((project) => ({
    id: project.slug,
    name: project.name,
    description: project.description,
    details: project.details,
    status: project.status,
    category: project.category,
    origin: project.origin,
    year: project.year,
    image: project.image,
    stack: project.stack,
    demoUrl: project.demoUrl,
    githubUrl: project.githubUrl,
    featured: project.featured,
    createdAt: now,
  }));

  return {
    users,
    profiles,
    teams,
    teamMembers,
    projects,
    projectMembers,
    clientRequests: [],
    notifications: [],
  };
}
