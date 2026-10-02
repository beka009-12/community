"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/src/server/auth/dal";
import { setClientRequestStatus } from "@/src/server/repositories/requests";
import { parseRequestStatus } from "@/src/server/validation/request-status";
import type { FormState } from "./form-state";
import { toFormError } from "./handle-error";

export async function setRequestStatusAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseRequestStatus(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await setClientRequestStatus(id, parsed.data.status);
  } catch (error) {
    return toFormError(error, {});
  }
  // The layout shows the NEW-requests badge, so refresh all admin pages.
  revalidatePath("/admin", "layout");
  return { ok: true };
}
