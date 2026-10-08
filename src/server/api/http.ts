import type { ZodType } from "zod";
import { ApiError, parseDrfErrors } from "./errors";

// No `server-only` or next/* imports: proxy.ts uses this module too.

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
  timeoutMs?: number;
}

const TIMEOUT_MS = 10_000;

export function apiUrl(path: string): string {
  const base = process.env.API_URL;
  if (!base) throw new ApiError("unavailable", 0, "API_URL is not set");
  return `${base.replace(/\/+$/, "")}${path}`;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = "GET", body, token, cache, next, timeoutMs = TIMEOUT_MS } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(apiUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // A 3xx means the route is shadowed (today: by the Django admin).
      // Surface it instead of following it to an HTML login page.
      redirect: "manual",
      // Note: a signal opts out of fetch memoization; resource getters
      // dedupe with React cache() instead.
      signal: AbortSignal.timeout(timeoutMs),
      cache,
      next,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("unavailable", 0, `${method} ${path}: ${String(error)}`);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function toError(response: Response, where: string): Promise<ApiError> {
  const { status } = response;
  if (response.type === "opaqueredirect" || (status >= 300 && status < 400)) {
    const location = response.headers.get("location") ?? "";
    return new ApiError("redirected", status, `${where} → ${status} ${location}`.trim());
  }
  if (status === 400) {
    const { message, fieldErrors } = parseDrfErrors(await readJson(response));
    return new ApiError("validation", status, message ?? "", fieldErrors);
  }
  if (status === 401) return new ApiError("unauthorized", status, `${where} → 401`);
  if (status === 403) return new ApiError("forbidden", status, `${where} → 403`);
  if (status === 404) return new ApiError("not_found", status, `${where} → 404`);
  return new ApiError("unavailable", status, `${where} → ${status}`);
}

async function call(path: string, options: RequestOptions): Promise<unknown> {
  const where = `${options.method ?? "GET"} ${path}`;
  const response = await send(path, options);
  if (!response.ok) throw await toError(response, where);
  const text = response.status === 204 ? "" : await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("bad_response", response.status, `${where}: not JSON`);
  }
}

export async function request<T>(
  path: string,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const data = await call(path, options);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const where = `${options.method ?? "GET"} ${path}`;
    console.error(`Unexpected API response for ${where}`, parsed.error.issues);
    throw new ApiError("bad_response", 200, `${where}: schema mismatch`);
  }
  return parsed.data;
}

export async function requestNoContent(path: string, options: RequestOptions = {}): Promise<void> {
  await call(path, options);
}
