"use server";

import { revalidatePath } from "next/cache";
import { createClientRequest } from "@/src/server/repositories/requests";
import { parseClientRequest } from "@/src/server/validation/client-request";
import type { FieldErrors } from "@/src/server/validation/form";

export interface RequestFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
  // Echoed back: React resets the form after an action, and a client who
  // mistyped their email shouldn't have to retype the whole brief.
  values?: Record<string, string>;
}

const echo = (formData: FormData): Record<string, string> =>
  Object.fromEntries(
    [...formData.entries()].filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && !entry[0].startsWith("$"),
    ),
  );

// Public: clients have no account (ТЗ §3), so no session check here.
export async function submitClientRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const parsed = parseClientRequest(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors, values: echo(formData) };
  }

  try {
    await createClientRequest(parsed.data);
  } catch (error) {
    console.error("Failed to save client request", error);
    return {
      error:
        "Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.",
      values: echo(formData),
    };
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}
