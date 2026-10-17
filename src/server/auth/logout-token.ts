import type { Tokens } from "@/src/server/api/schemas";
import { isApiError } from "@/src/server/api/errors";
import { jwtExpiresAt } from "./jwt";
import { needsRefresh } from "./proxy-decision";

interface StoredTokens {
  access?: string;
  refresh?: string;
}

// /auth/logout/ rejects an expired access token, so a stale one is swapped
// for a fresh one first. null: the refresh token is dead too, so the backend
// has nothing left to revoke.
export async function accessForLogout(
  { access, refresh }: StoredTokens,
  now: number,
  refreshTokens: (refresh: string) => Promise<Tokens>,
): Promise<string | null> {
  if (access && !needsRefresh(jwtExpiresAt(access), now)) return access;
  if (!refresh) return null;
  try {
    return (await refreshTokens(refresh)).access;
  } catch (error) {
    if (isApiError(error, "unauthorized")) return null;
    throw error;
  }
}
