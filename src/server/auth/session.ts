import "server-only";
import { cookies } from "next/headers";
import type { UserRole } from "@/src/lib/api-enums";
import {
  ACCESS_COOKIE,
  AUTH_COOKIES,
  REFRESH_COOKIE,
  SESSION_COOKIE,
  authCookieOptions,
} from "./cookies";
import { jwtExpiresAt } from "./jwt";
import { signToken, verifyToken, type SessionPayload } from "./session-token";

// Only for a token without a readable `exp`.
const FALLBACK_TTL_MS = 8 * 60 * 60 * 1000;

export const authSecret = (): string => {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return value;
};

export interface NewSession {
  access: string;
  refresh?: string;
  userId: number;
  role: UserRole;
}

// mc_session lives as long as the refresh token: it's how proxy.ts and the
// pages know the role without asking the API.
export async function startSession({ access, refresh, userId, role }: NewSession): Promise<void> {
  const accessExp = jwtExpiresAt(access) ?? Date.now() + FALLBACK_TTL_MS;
  const refreshExp = (refresh ? jwtExpiresAt(refresh) : null) ?? accessExp;
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, authCookieOptions(accessExp));
  if (refresh) store.set(REFRESH_COOKIE, refresh, authCookieOptions(refreshExp));
  const session = await signToken({ sub: String(userId), role, exp: refreshExp }, authSecret());
  store.set(SESSION_COOKIE, session, authCookieOptions(refreshExp));
}

export async function readSession(): Promise<SessionPayload | null> {
  return verifyToken((await cookies()).get(SESSION_COOKIE)?.value, authSecret());
}

export async function readTokens(): Promise<{ access?: string; refresh?: string }> {
  const store = await cookies();
  return { access: store.get(ACCESS_COOKIE)?.value, refresh: store.get(REFRESH_COOKIE)?.value };
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  for (const name of AUTH_COOKIES) store.delete(name);
}
