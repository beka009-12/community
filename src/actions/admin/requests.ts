"use server";

import { setClientRequestStatus } from "@/src/server/api/client-requests";
import { requireAdmin } from "@/src/server/auth/dal";
import { parseRequestStatus } from "@/src/server/validation/request-status";
import type { FormState } from "../form-state";
import { toFormError } from "../handle-error";
import { refreshAfterAdminChange } from "./refresh";

export async function setRequestStatusAction(
  id: number,
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
  refreshAfterAdminChange();
  return { ok: true };
}
