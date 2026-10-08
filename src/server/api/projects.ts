import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { MembershipRole, ProjectStatus } from "@/src/lib/api-enums";
import { authedDelete, authedGet, authedSend, publicGet } from "./client";
import { nullIfNotFound } from "./errors";
import {
  createdSchema,
  listOf,
  membershipSchema,
  projectDetailSchema,
  projectListItemSchema,
  type Membership,
  type ProjectDetail,
  type ProjectListItem,
} from "./schemas";

export interface ProjectWrite {
  name: string;
  description: string;
  project_status: ProjectStatus;
  category: string;
  demo_url: string | null;
  github_url: string | null;
}

const listSchema = listOf(projectListItemSchema);

export const getProjects = cache(
  (fresh = false): Promise<ProjectListItem[]> =>
    fresh ? authedGet("/projects/", listSchema) : publicGet("/projects/", listSchema, "projects"),
);

export const getProject = cache(
  (id: number, fresh = false): Promise<ProjectDetail | null> =>
    nullIfNotFound(
      fresh
        ? authedGet(`/projects/${id}/`, projectDetailSchema)
        : publicGet(`/projects/${id}/`, projectDetailSchema, "projects"),
    ),
);

// The list endpoint has no `members`, so teams cost one request per
// project (docs/backend-issues.md). They run in parallel.
export const getProjectsWithMembers = cache(async (fresh = false): Promise<ProjectDetail[]> => {
  const projects = await getProjects(fresh);
  const details = await Promise.all(projects.map((project) => getProject(project.id, fresh)));
  return details.filter((project): project is ProjectDetail => project !== null);
});

export const getProjectMembers = cache(
  (id: number): Promise<Membership[]> => authedGet(`/projects/${id}/members/`, listOf(membershipSchema)),
);

export async function createProject(data: ProjectWrite): Promise<number> {
  return (await authedSend("POST", "/projects/", data, createdSchema)).id;
}

export async function updateProject(id: number, data: ProjectWrite): Promise<void> {
  await authedSend("PATCH", `/projects/${id}/`, data, z.unknown());
}

export const deleteProject = (id: number): Promise<void> => authedDelete(`/projects/${id}/`);

export async function addProjectMember(
  projectId: number,
  user: number,
  role: MembershipRole,
): Promise<void> {
  await authedSend("POST", `/projects/${projectId}/members/`, { user, role }, z.unknown());
}

export const removeProjectMember = (projectId: number, userId: number): Promise<void> =>
  authedDelete(`/projects/${projectId}/members/${userId}/`);
