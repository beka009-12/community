import { z } from "zod";

export type FieldErrors = Partial<Record<string, string>>;

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; fieldErrors: FieldErrors };

// Blank optional inputs arrive as "" — treat them as absent.
export const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max, `Не больше ${max} символов`).optional(),
  );

export const optionalUrl = () =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.url("Введите ссылку целиком, с https://").optional(),
  );

export const requiredText = (min: number, max: number, label: string) =>
  z
    .string({ error: `Заполните поле «${label}»` })
    .trim()
    .min(min, min <= 1 ? `Заполните поле «${label}»` : `Минимум ${min} символа`)
    .max(max, `Не больше ${max} символов`);

// Comma-separated input → trimmed, non-empty list.
export const commaList = (maxItems: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string"
        ? value.split(",").map((item) => item.trim()).filter(Boolean)
        : [],
    z.array(z.string().max(40)).max(maxItems, `Не больше ${maxItems} пунктов`),
  );

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
