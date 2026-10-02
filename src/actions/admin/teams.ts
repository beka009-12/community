"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/src/server/auth/dal";
import {
  createTeam,
  removeTeamMember,
  updateTeam,
  upsertTeamMember,
} from "@/src/server/repositories/teams";
import { parseMembership, parseTeam } from "@/src/server/validation/team";
import {
  echoValues,
  SAVE_FAILED,
  type ActionResult,
  type FormState,
} from "./form-state";
import { toFormError } from "./handle-error";

const revalidateTeam = (id: string) => {
  revalidatePath("/admin/teams");
  revalidatePath(`/admin/teams/${id}`);
};

export async function createTeamAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseTeam(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  let id: string;
  try {
    id = (await createTeam(parsed.data)).id;
  } catch (error) {
    return toFormError(error, values);
  }
  revalidateTeam(id);
  redirect(`/admin/teams/${id}`);
}

export async function updateTeamAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseTeam(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await updateTeam(id, parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  revalidateTeam(id);
  return { ok: true, values };
}

export async function upsertTeamMemberAction(
  teamId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseMembership(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await upsertTeamMember(teamId, parsed.data.userId, parsed.data.role);
  } catch (error) {
    return toFormError(error, {});
  }
  revalidateTeam(teamId);
  return { ok: true };
}

export async function removeTeamMemberAction(
  teamId: string,
  userId: string,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await removeTeamMember(teamId, userId);
  } catch (error) {
    console.error("Remove team member failed", error);
    return { error: SAVE_FAILED };
  }
  revalidateTeam(teamId);
  return {};
}
