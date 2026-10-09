"use server";

import { revalidatePath, updateTag } from "next/cache";
import { changeMyPassword, updateMyProfile } from "@/src/server/api/account";
import { requireRole } from "@/src/server/auth/dal";
import { parsePasswordChange, parseProfile } from "@/src/server/validation/account";
import { echoValues, type FormState } from "../form-state";
import { toFormError } from "../handle-error";

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole();
  const values = echoValues(formData);
  const parsed = parseProfile(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await updateMyProfile(parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  // The profile is public on /team/[id].
  updateTag("members");
  revalidatePath("/account", "layout");
  return { ok: true, values };
}

// Passwords are never echoed back to the browser.
export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole();
  const parsed = parsePasswordChange(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await changeMyPassword(parsed.data.password);
  } catch (error) {
    return toFormError(error, {});
  }
  return { ok: true };
}
