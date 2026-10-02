import "server-only";
import { mutateDb, readDb } from "@/src/server/db/store";
import type { DbProject, MembershipRole } from "@/src/server/db/types";
import { ConflictError, NotFoundError } from "./errors";
import { joinMember } from "./members";
import type { MemberWithRole } from "./teams";

export type ProjectInput = Omit<DbProject, "createdAt">;

export async function listProjects(): Promise<
  Array<DbProject & { memberCount: number }>
> {
  const db = await readDb();
  return db.projects.map((project) => ({
    ...project,
    memberCount: db.projectMembers.filter((row) => row.projectId === project.id).length,
  }));
}

export async function getProject(
  id: string,
): Promise<{ project: DbProject; members: MemberWithRole[] } | null> {
  const db = await readDb();
  const project = db.projects.find((item) => item.id === id);
  if (!project) return null;
  const members = db.projectMembers
    .filter((row) => row.projectId === id)
    .flatMap((row) => {
      const member = joinMember(db, row.userId);
      return member ? [{ ...member, membershipRole: row.role }] : [];
    });
  return { project, members };
}

export async function createProject(input: ProjectInput): Promise<DbProject> {
  return mutateDb((db) => {
    if (db.projects.some((project) => project.id === input.id)) {
      throw new ConflictError("id", "Такой адрес проекта уже занят");
    }
    const project: DbProject = { ...input, createdAt: new Date().toISOString() };
    db.projects.push(project);
    return project;
  });
}

export async function updateProject(
  id: string,
  input: Omit<ProjectInput, "id">,
): Promise<DbProject> {
  return mutateDb((db) => {
    const project = db.projects.find((item) => item.id === id);
    if (!project) throw new NotFoundError("Проект не найден");
    Object.assign(project, input);
    return project;
  });
}

export async function upsertProjectMember(
  projectId: string,
  userId: string,
  role: MembershipRole,
): Promise<void> {
  await mutateDb((db) => {
    if (!db.projects.some((project) => project.id === projectId)) {
      throw new NotFoundError("Проект не найден");
    }
    if (!db.users.some((user) => user.id === userId)) {
      throw new NotFoundError("Участник не найден");
    }
    const row = db.projectMembers.find(
      (item) => item.projectId === projectId && item.userId === userId,
    );
    if (row) row.role = role;
    else db.projectMembers.push({ projectId, userId, role });
  });
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  await mutateDb((db) => {
    db.projectMembers = db.projectMembers.filter(
      (row) => !(row.projectId === projectId && row.userId === userId),
    );
  });
}
