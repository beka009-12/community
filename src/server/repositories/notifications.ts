import "server-only";
import { readDb } from "@/src/server/db/store";
import type { DbNotification } from "@/src/server/db/types";

// Newest first.
export async function listNotificationsFor(userId: string): Promise<DbNotification[]> {
  const { notifications } = await readDb();
  return notifications.filter((note) => note.userId === userId);
}

export async function lastAdminEdit(userId: string): Promise<DbNotification | null> {
  const notes = await listNotificationsFor(userId);
  return notes.find((note) => note.kind === "PROFILE_EDITED_BY_ADMIN") ?? null;
}
