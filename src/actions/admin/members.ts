"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generatePassword } from "@/src/server/auth/password";
import { requireAdmin } from "@/src/server/auth/dal";
import {
  createMember,
  resetMemberPassword,
  setMemberStatus,
  updateMember,
} from "@/src/server/repositories/members";
import type { UserStatus } from "@/src/server/db/types";
import { parseMemberCreate, parseMemberUpdate } from "@/src/server/validation/member";
import { echoValues, type FormState } from "./form-state";
import { toFormError } from "./handle-error";

const revalidateMember = (id: string) => {
  revalidatePath("/admin", "layout");
  revalidatePath("/team");
  revalidatePath(`/team/${id}`);
};

export async function createMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseMemberCreate(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  let id: string;
  try {
    id = (await createMember(parsed.data)).user.id;
  } catch (error) {
    return toFormError(error, values);
  }
  revalidateMember(id);
  redirect(`/admin/members/${id}?created=1`);
}

export async function updateMemberAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseMemberUpdate(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await updateMember(id, parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  revalidateMember(id);
  return { ok: true, values };
}

const STATUSES: UserStatus[] = ["ACTIVE", "INACTIVE"];

export async function setMemberStatusAction(id: string, status: UserStatus): Promise<void> {
  await requireAdmin();
  if (!STATUSES.includes(status)) return;
  try {
    await setMemberStatus(id, status);
  } catch (error) {
    console.error("Status change failed", error);
    return;
  }
  revalidateMember(id);
}

// Returns the new password once so the admin can hand it over; only the
// hash is stored.
export async function resetPasswordAction(
  id: string,
): Promise<{ password?: string; error?: string }> {
  await requireAdmin();
  const password = generatePassword();
  try {
    await resetMemberPassword(id, password);
  } catch (error) {
    console.error("Password reset failed", error);
    return { error: "Не удалось сбросить пароль." };
  }
  return { password };
}

export async function generatePasswordAction(): Promise<string> {
  await requireAdmin();
  return generatePassword();
}
