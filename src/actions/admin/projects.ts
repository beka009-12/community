"use server";

import { redirect } from "next/navigation";
import {
  addProjectMember,
  createProject,
  deleteProject,
  removeProjectMember,
  updateProject,
} from "@/src/server/api/projects";
import { requireAdmin } from "@/src/server/auth/dal";
import { parseMembership } from "@/src/server/validation/membership";
import { parseProject } from "@/src/server/validation/project";
import { echoValues, type ActionResult, type FormState } from "../form-state";
import { toActionError, toFormError } from "../handle-error";
import { refreshAfterAdminChange } from "./refresh";

export async function createProjectAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseProject(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  let id: number;
  try {
    id = await createProject(parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshAfterAdminChange();
  redirect(`/admin/projects/${id}`);
}

export async function updateProjectAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseProject(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await updateProject(id, parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshAfterAdminChange();
  return { ok: true, values };
}

export async function deleteProjectAction(id: number, _prev: ActionResult): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteProject(id);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  redirect("/admin/projects");
}

export async function addProjectMemberAction(
  projectId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseMembership(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await addProjectMember(projectId, parsed.data.user, parsed.data.role);
  } catch (error) {
    return toFormError(error, {});
  }
  refreshAfterAdminChange();
  return { ok: true };
}

export async function removeProjectMemberAction(projectId: number, userId: number): Promise<ActionResult> {
  await requireAdmin();
  try {
    await removeProjectMember(projectId, userId);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  return {};
}
