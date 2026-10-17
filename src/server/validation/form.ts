import { z } from "zod";

export type FieldErrors = Partial<Record<string, string>>;

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; fieldErrors: FieldErrors };

export const requiredText = (min: number, max: number, label: string) =>
  z
    .string({ error: `Заполните поле «${label}»` })
    .trim()
    .min(min, min <= 1 ? `Заполните поле «${label}»` : `Минимум ${min} символа`)
    .max(max, `Не больше ${max} символов`);

export function parseForm<S extends z.ZodType>(
  schema: S,
  formData: FormData,
): ParseResult<z.infer<S>> {
  const result = schema.safeParse(Object.fromEntries(formData));
  if (result.success) return { success: true, data: result.data };
  const flat = z.flattenError(result.error).fieldErrors as Record<string, string[] | undefined>;
  const fieldErrors: FieldErrors = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) fieldErrors[key] = messages[0];
  }
  return { success: false, fieldErrors };
}

// Blank → null: the API clears a nullable URL only when it receives null.
export const nullableUrl = (max = 200) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.url("Введите ссылку целиком, с https://").max(max, `Не больше ${max} символов`).nullable(),
  );
