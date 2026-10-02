import "server-only";
import { ConflictError, NotFoundError } from "@/src/server/repositories/errors";
import type { FormState } from "./form-state";

// Maps repository errors to what the admin sees; anything unexpected is
// logged and shown as a generic retry message.
export function toFormError(
  error: unknown,
  values: Record<string, string>,
): FormState {
  if (error instanceof ConflictError) {
    return { fieldErrors: { [error.field]: error.message }, values };
  }
  if (error instanceof NotFoundError) {
    return { error: error.message, values };
  }
  console.error("Admin mutation failed", error);
  return { error: "Не удалось сохранить. Попробуйте ещё раз.", values };
}
