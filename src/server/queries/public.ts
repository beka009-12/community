import "server-only";
import type { Member } from "@/src/data/members";
import type { Project } from "@/src/data/projects";
import type { MemberProject } from "@/src/data/teams";
import { connection } from "next/server";
import { readDb as readStore } from "@/src/server/db/store";
import type { Db, DbProject } from "@/src/server/db/types";

// View models for the public site, in the exact shapes its components
// were built against (src/data types), so the UI didn't need rewriting
// when data moved from mocks to the store. INACTIVE members never leave
// this module.

export interface ProjectTeam {
  id: string;
  projectSlug: string;
  projectName: string;
  members: Member[];
}

// connection(): render at request time, so admin edits show up without a
// rebuild (the store is read during prerendering otherwise).
const readDb = async () => {
  await connection();
  return readStore();
};

const toMember = (db: Db, userId: string): Member | null => {
  const user = db.users.find((item) => item.id === userId);
  const profile = db.profiles.find((item) => item.userId === userId);
  if (!user || !profile || user.status !== "ACTIVE") return null;
  return {
    id: user.id,
    specializationId: profile.specializationId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    role: profile.roleTitle,
    stack: profile.stack,
    photo: profile.photo,
    bio: profile.bio,
    skills: profile.skills,
    github: profile.github,
    linkedin: profile.linkedin,
    portfolio: profile.portfolio,
    resume: profile.resume,
    experience: profile.experience,
    education: profile.education,
    status: user.status,
  };
};

const toProject = ({ id, ...rest }: DbProject): Project => ({ slug: id, ...rest });

const projectMembers = (db: Db, projectId: string): Member[] =>
  db.projectMembers
    .filter((row) => row.projectId === projectId)
    .map((row) => toMember(db, row.userId))
    .filter((member): member is Member => member !== null);

export async function getPublicMembers(): Promise<Member[]> {
  const db = await readDb();
  return db.users
    .map((user) => toMember(db, user.id))
    .filter((member): member is Member => member !== null);
}

export async function getPublicMember(id: string): Promise<Member | null> {
  return toMember(await readDb(), id);
}

export async function getPublicProjects(): Promise<Project[]> {
  return (await readDb()).projects.map(toProject);
}

export async function getPublicProject(slug: string): Promise<{
  project: Project;
  members: Member[];
  adjacent: { prev: Project; next: Project };
} | null> {
  const db = await readDb();
  const index = db.projects.findIndex((item) => item.id === slug);
  if (index === -1) return null;
  const count = db.projects.length;
  return {
    project: toProject(db.projects[index]),
    members: projectMembers(db, slug),
    adjacent: {
      prev: toProject(db.projects[(index - 1 + count) % count]),
      next: toProject(db.projects[(index + 1) % count]),
    },
  };
}

export async function getMemberProjects(memberId: string): Promise<MemberProject[]> {
  const db = await readDb();
  return db.projectMembers
    .filter((row) => row.userId === memberId)
    .flatMap((row) => {
      const project = db.projects.find((item) => item.id === row.projectId);
      return project ? [{ project: toProject(project), role: row.role }] : [];
    });
}

// "Команды по проектам" on /team: one card per project that has people.
export async function getProjectTeams(): Promise<ProjectTeam[]> {
  const db = await readDb();
  return db.projects
    .map((project) => ({
      id: project.id,
      projectSlug: project.id,
      projectName: project.name,
      members: projectMembers(db, project.id),
    }))
    .filter((team) => team.members.length > 0);
}
