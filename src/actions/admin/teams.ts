"use server";

import { redirect } from "next/navigation";
import {
  addTeamMember,
  createTeam,
  deleteTeam,
  removeTeamMember,
  updateTeam,
} from "@/src/server/api/teams";
import { requireAdmin } from "@/src/server/auth/dal";
import { parseMembership } from "@/src/server/validation/membership";
import { parseTeam } from "@/src/server/validation/team";
import { echoValues, type ActionResult, type FormState } from "./form-state";
import { toActionError, toFormError } from "./handle-error";
import { refreshAfterAdminChange } from "./refresh";

export async function createTeamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseTeam(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  let id: number;
  try {
    id = await createTeam(parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshAfterAdminChange();
  redirect(`/admin/teams/${id}`);
}

export async function updateTeamAction(
  id: number,
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
  refreshAfterAdminChange();
  return { ok: true, values };
}

export async function deleteTeamAction(id: number, _prev: ActionResult): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteTeam(id);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  redirect("/admin/teams");
}

export async function addTeamMemberAction(
  teamId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseMembership(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await addTeamMember(teamId, parsed.data.user, parsed.data.role);
  } catch (error) {
    return toFormError(error, {});
  }
  refreshAfterAdminChange();
  return { ok: true };
}

export async function removeTeamMemberAction(teamId: number, userId: number): Promise<ActionResult> {
  await requireAdmin();
  try {
    await removeTeamMember(teamId, userId);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  return {};
}
