import { NextResponse, type NextRequest } from "next/server";
import { refreshTokens, verifyAccess } from "@/src/server/api/auth";
import { isApiError } from "@/src/server/api/errors";
import {
  ACCESS_COOKIE,
  AUTH_COOKIES,
  REFRESH_COOKIE,
  SESSION_COOKIE,
  authCookieOptions,
} from "@/src/server/auth/cookies";
import { jwtExpiresAt } from "@/src/server/auth/jwt";
import { areaOf, decideAccess, needsRefresh } from "@/src/server/auth/proxy-decision";
import { LOGIN_PATH, homeFor } from "@/src/server/auth/routes";
import { signToken, verifyToken, type SessionPayload } from "@/src/server/auth/session-token";

interface CookieWrite {
  name: string;
  value: string;
  expiresAt: number;
}

const secret = () => process.env.AUTH_SECRET ?? "";

// "expired": the backend refused the refresh token. null: it couldn't be
// reached, so keep the cookies and let the page show its own error.
async function refreshSession(
  refresh: string,
  session: SessionPayload,
): Promise<CookieWrite[] | "expired" | null> {
  try {
    const tokens = await refreshTokens(refresh);
    const writes: CookieWrite[] = [
      { name: ACCESS_COOKIE, value: tokens.access, expiresAt: jwtExpiresAt(tokens.access) ?? session.exp },
    ];
    if (tokens.refresh) {
      const exp = jwtExpiresAt(tokens.refresh) ?? session.exp;
      writes.push(
        { name: REFRESH_COOKIE, value: tokens.refresh, expiresAt: exp },
        { name: SESSION_COOKIE, value: await signToken({ ...session, exp }, secret()), expiresAt: exp },
      );
    }
    return writes;
  } catch (error) {
    return isApiError(error, "unauthorized") || isApiError(error, "validation") ? "expired" : null;
  }
}

// null: the API couldn't answer.
async function stillValid(access: string): Promise<boolean | null> {
  try {
    return await verifyAccess(access);
  } catch {
    return null;
  }
}

// Rebuilds the Cookie header so this very render already sees refreshed or
// cleared cookies.
function forward(request: NextRequest, jar: Map<string, string>): NextResponse {
  const headers = new Headers(request.headers);
  headers.set(
    "cookie",
    [...jar].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; "),
  );
  return NextResponse.next({ request: { headers } });
}

// Optimistic only: requireRole() in pages and actions is our real guard,
// and the backend checks every call again.
export async function proxy(request: NextRequest) {
  const now = Date.now();
  const area = areaOf(request.nextUrl.pathname);
  const jar = new Map(request.cookies.getAll().map((cookie) => [cookie.name, cookie.value]));
  const session = await verifyToken(jar.get(SESSION_COOKIE), secret(), now);
  // Auth cookies without a valid signed session are leftovers: drop them.
  let clear = !session && AUTH_COOKIES.some((name) => jar.has(name));
  let writes: CookieWrite[] = [];

  const access = jar.get(ACCESS_COOKIE);
  const refresh = jar.get(REFRESH_COOKIE);
  if (session && refresh && needsRefresh(access ? jwtExpiresAt(access) : null, now)) {
    const result = await refreshSession(refresh, session);
    if (result === "expired") clear = true;
    else if (result) writes = result;
  }

  for (const { name, value } of writes) jar.set(name, value);
  if (clear) AUTH_COOKIES.forEach((name) => jar.delete(name));

  const role = clear ? null : (session?.role ?? null);
  const decision = decideAccess(area, role, jar.has(ACCESS_COOKIE));
  let target = decision.kind === "login" ? LOGIN_PATH : null;

  if (decision.kind === "verify" && role) {
    // Without this check a revoked token loops: page → /login → back.
    const valid = await stillValid(jar.get(ACCESS_COOKIE) ?? "");
    if (valid) target = homeFor(role);
    if (valid === false) {
      clear = true;
      AUTH_COOKIES.forEach((name) => jar.delete(name));
    }
  }

  const response = target ? NextResponse.redirect(new URL(target, request.url)) : forward(request, jar);
  if (clear) AUTH_COOKIES.forEach((name) => response.cookies.delete(name));
  else {
    for (const { name, value, expiresAt } of writes) {
      response.cookies.set(name, value, authCookieOptions(expiresAt));
    }
  }
  return response;
}

export const config = { matcher: ["/admin/:path*", "/account/:path*", "/login"] };
