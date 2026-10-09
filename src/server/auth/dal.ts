import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { UserRole } from "@/src/lib/api-enums";
import { LOGIN_PATH } from "./routes";
import { readSession } from "./session";
import type { SessionPayload } from "./session-token";

// Our real guard; the backend re-checks every call anyway, and proxy.ts
// only redirects optimistically. No roles = any signed-in user.
export const requireRole = cache(async (...roles: UserRole[]): Promise<SessionPayload> => {
  const session = await readSession();
  if (!session || (roles.length > 0 && !roles.includes(session.role))) redirect(LOGIN_PATH);
  return session;
});

export const requireAdmin = (): Promise<SessionPayload> => requireRole("Admin");
