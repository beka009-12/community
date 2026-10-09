import type { UserRole } from "@/src/lib/api-enums";

export const REFRESH_MARGIN_MS = 30_000;

export type Area = "admin" | "account" | "login" | "other";

export function areaOf(pathname: string): Area {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/account" || pathname.startsWith("/account/")) return "account";
  if (pathname === "/login") return "login";
  return "other";
}

// Refresh a missing or nearly expired access token (the caller checks that
// a refresh token exists).
export const needsRefresh = (accessExpiresAt: number | null, now: number): boolean =>
  accessExpiresAt === null || accessExpiresAt - now < REFRESH_MARGIN_MS;

export type Access =
  | { kind: "allow" }
  | { kind: "login" }
  // Signed in and on /login: confirm the token before sending them home.
  | { kind: "verify" };

// role: from a valid mc_session; hasAccess: an access token is present.
export function decideAccess(area: Area, role: UserRole | null, hasAccess: boolean): Access {
  const signedIn = role !== null && hasAccess;
  switch (area) {
    case "admin":
      return signedIn && role === "Admin" ? { kind: "allow" } : { kind: "login" };
    case "account":
      return signedIn ? { kind: "allow" } : { kind: "login" };
    case "login":
      return signedIn ? { kind: "verify" } : { kind: "allow" };
    default:
      return { kind: "allow" };
  }
}
