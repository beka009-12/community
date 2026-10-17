"use server";

import { redirect } from "next/navigation";
import { USER_STATUSES, type UserStatus } from "@/src/lib/api-enums";
import {
  createAdminMember,
  deleteAdminMember,
  updateAdminMember,
} from "@/src/server/api/admin-members";
import { setMemberStatus } from "@/src/server/api/members";
import { requireAdmin } from "@/src/server/auth/dal";
import { generatePassword } from "@/src/server/auth/password";
import {
  parseMemberCreate,
  parseMemberProfile,
  parseRole,
} from "@/src/server/validation/member";
import { echoValues, type ActionResult, type FormState } from "../form-state";
import { toActionError, toFormError } from "../handle-error";
import { refreshAfterAdminChange } from "./refresh";

export async function createMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  // Never echo the password back to the browser.
  delete values.password;
  const parsed = parseMemberCreate(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  let id: number;
  try {
    id = await createAdminMember(parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshAfterAdminChange();
  redirect(`/admin/members/${id}?created=1`);
}

export async function setMemberStatusAction(
  id: number,
  status: UserStatus,
): Promise<ActionResult> {
  await requireAdmin();
  if (!USER_STATUSES.includes(status)) return { error: "Неизвестный статус" };
  try {
    await setMemberStatus(id, status);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  return {};
}

// Returns the new password once so the admin can hand it over.
export async function resetPasswordAction(
  id: number,
): Promise<{ password?: string; error?: string }> {
  await requireAdmin();
  const password = generatePassword();
  try {
    await updateAdminMember(id, { password });
  } catch (error) {
    return toActionError(error);
  }
  return { password };
}

export async function generatePasswordAction(): Promise<string> {
  await requireAdmin();
  return generatePassword();
}

export async function updateMemberProfileAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseMemberProfile(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await updateAdminMember(id, parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshAfterAdminChange();
  return { ok: true, values };
}

export async function setMemberRoleAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseRole(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await updateAdminMember(id, { role: parsed.data.role });
  } catch (error) {
    return toFormError(error, {});
  }
  refreshAfterAdminChange();
  return { ok: true };
}

export async function deleteMemberAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteAdminMember(id);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  redirect("/admin/members");
}
