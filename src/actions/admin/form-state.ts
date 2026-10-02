import type { FieldErrors } from "@/src/server/validation/form";

export interface FormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
  // Echoed back so React's post-action form reset doesn't wipe the inputs.
  values?: Record<string, string>;
}

export const echoValues = (formData: FormData): Record<string, string> =>
  Object.fromEntries(
    [...formData.entries()].filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && !entry[0].startsWith("$"),
    ),
  );
