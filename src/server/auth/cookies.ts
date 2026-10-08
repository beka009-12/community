// Shared by Server Actions (cookies()) and proxy.ts (NextResponse cookies).
export const ACCESS_COOKIE = "mc_access";
export const REFRESH_COOKIE = "mc_refresh";
export const SESSION_COOKIE = "mc_session";
export const AUTH_COOKIES = [ACCESS_COOKIE, REFRESH_COOKIE, SESSION_COOKIE] as const;

export interface AuthCookieOptions {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  expires: Date;
}

export const authCookieOptions = (expiresAt: number): AuthCookieOptions => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  expires: new Date(expiresAt),
});
