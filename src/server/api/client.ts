import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ZodType } from "zod";
import { ACCESS_COOKIE } from "@/src/server/auth/cookies";
import { LOGIN_PATH } from "@/src/server/auth/routes";
import { isApiError } from "./errors";
import { request, requestNoContent, type HttpMethod } from "./http";

export type PublicTag = "members" | "projects" | "stats";
export const PUBLIC_TAGS: readonly PublicTag[] = ["members", "projects", "stats"];

const PUBLIC_REVALIDATE_SECONDS = 60;

// Public data: shared tagged cache, never a token. connection() keeps the
// page request-time rendered, so builds never depend on the API being up.
export async function publicGet<T>(path: string, schema: ZodType<T>, tag: PublicTag): Promise<T> {
  await connection();
  return request(path, schema, { next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [tag] } });
}

// Token calls are never cached; a rejected token ends up on /login, where
// proxy.ts verifies it and clears the dead cookies.
async function withToken<T>(call: (token: string) => Promise<T>): Promise<T> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect(LOGIN_PATH);
  try {
    return await call(token);
  } catch (error) {
    if (isApiError(error, "unauthorized")) redirect(LOGIN_PATH);
    throw error;
  }
}

export const authedGet = <T>(path: string, schema: ZodType<T>): Promise<T> =>
  withToken((token) => request(path, schema, { token, cache: "no-store" }));

export const authedSend = <T>(
  method: Exclude<HttpMethod, "GET">,
  path: string,
  body: unknown,
  schema: ZodType<T>,
): Promise<T> => withToken((token) => request(path, schema, { method, body, token, cache: "no-store" }));

export const authedDelete = (path: string): Promise<void> =>
  withToken((token) => requestNoContent(path, { method: "DELETE", token, cache: "no-store" }));
