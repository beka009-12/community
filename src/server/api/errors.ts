export type ApiErrorKind =
  | "unavailable"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "redirected"
  | "bad_response";

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const isApiError = (error: unknown, kind?: ApiErrorKind): error is ApiError =>
  error instanceof ApiError && (kind === undefined || error.kind === kind);

const firstMessage = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  const items = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.values(value)
      : [];
  for (const entry of items) {
    const message = firstMessage(entry);
    if (message) return message;
  }
  return undefined;
};

// DRF answers {"detail": "..."} or {"field": ["..."], "non_field_errors": ["..."]}.
export function parseDrfErrors(body: unknown): {
  message?: string;
  fieldErrors: Record<string, string>;
} {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: firstMessage(body), fieldErrors: {} };
  }
  const { detail, non_field_errors: nonField, ...fields } = body as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  for (const [field, value] of Object.entries(fields)) {
    const message = firstMessage(value);
    if (message) fieldErrors[field] = message;
  }
  return { message: firstMessage(detail) ?? firstMessage(nonField), fieldErrors };
}

const USER_MESSAGES: Record<ApiErrorKind, string> = {
  unavailable: "Сервер недоступен. Попробуйте ещё раз через минуту.",
  unauthorized: "Сессия истекла. Войдите снова.",
  forbidden: "Недостаточно прав для этого действия.",
  not_found: "Запись не найдена — возможно, её уже удалили.",
  validation: "Проверьте поля формы.",
  redirected: "Раздел временно недоступен: бэкенд перенаправляет запрос.",
  bad_response: "Сервер ответил в неожиданном формате.",
};

// What a person sees. Validation errors keep the backend's own wording.
export const apiErrorMessage = (error: ApiError): string =>
  error.kind === "validation" && error.message ? error.message : USER_MESSAGES[error.kind];

export async function nullIfNotFound<T>(load: Promise<T>): Promise<T | null> {
  try {
    return await load;
  } catch (error) {
    if (isApiError(error, "not_found")) return null;
    throw error;
  }
}
