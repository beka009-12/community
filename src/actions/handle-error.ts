import "server-only";
import { unstable_rethrow } from "next/navigation";
import { apiErrorMessage, isApiError } from "@/src/server/api/errors";
import { SAVE_FAILED, type ActionResult, type FormState } from "./form-state";

// Maps API errors to what the admin sees. Next's own control-flow errors
// (the redirect on an expired session) pass straight through.
export function toFormError(error: unknown, values: Record<string, string>): FormState {
  unstable_rethrow(error);
  // A field error may name a field the form doesn't have, so the form
  // always gets a message too.
  if (isApiError(error, "validation")) {
    return { fieldErrors: error.fieldErrors, error: apiErrorMessage(error), values };
  }
  if (isApiError(error)) return { error: apiErrorMessage(error), values };
  console.error("Admin mutation failed", error);
  return { error: SAVE_FAILED, values };
}

export function toActionError(error: unknown): ActionResult {
  unstable_rethrow(error);
  if (isApiError(error)) return { error: apiErrorMessage(error) };
  console.error("Admin action failed", error);
  return { error: SAVE_FAILED };
}
