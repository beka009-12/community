"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/server/auth/dal";
import {
  createProject,
  removeProjectMember,
  updateProject,
  upsertProjectMember,
} from "@/src/server/repositories/projects";
import { parseProjectCreate, parseProjectUpdate } from "@/src/server/validation/project";
import { parseMembership } from "@/src/server/validation/team";
import { echoValues, type FormState } from "./form-state";
import { toFormError } from "./handle-error";

// Projects show up on the homepage, /projects, project pages and member
// profiles — refresh all of them.
const revalidateProject = (id: string) => {
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath("/", "layout");
};

export async function createProjectAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseProjectCreate(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await createProject(parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  revalidateProject(parsed.data.id);
  redirect(`/admin/projects/${parsed.data.id}`);
}

export async function updateProjectAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseProjectUpdate(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await updateProject(id, parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  revalidateProject(id);
  return { ok: true, values };
}

export async function upsertProjectMemberAction(
  projectId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseMembership(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await upsertProjectMember(projectId, parsed.data.userId, parsed.data.role);
  } catch (error) {
    return toFormError(error, {});
  }
  revalidateProject(projectId);
  return { ok: true };
}

export async function removeProjectMemberAction(projectId: string, userId: string): Promise<void> {
  await requireAdmin();
  try {
    await removeProjectMember(projectId, userId);
  } catch (error) {
    console.error("Remove project member failed", error);
    return;
  }
  revalidateProject(projectId);
}
