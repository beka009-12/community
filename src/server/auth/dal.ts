import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./session";
import type { SessionPayload } from "./session-token";

// The real guard: every admin page and admin Server Action calls this.
// proxy.ts only does the optimistic redirect.
export const requireAdmin = cache(async (): Promise<SessionPayload> => {
  const session = await readSession();
  if (!session || session.role !== "ADMIN") redirect("/login");
  return session;
});
