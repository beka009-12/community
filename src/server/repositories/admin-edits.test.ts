import { describe, expect, it } from "vitest";
import { setupTempDb } from "./test-db";
import { getMember, setMemberRole, updateMemberProfileByAdmin } from "./members";
import { listNotificationsFor } from "./notifications";
import { NotFoundError } from "./errors";
import { readDb } from "@/src/server/db/store";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

setupTempDb();

const profile = {
  firstName: "Участник",
  lastName: "01",
  specializationId: "frontend",
  roleTitle: "Тимлид Frontend",
  stack: "React · Next.js",
  bio: "Новое описание",
  skills: ["React", "Next.js", "TypeScript", "SCSS", "Code review"],
  github: "https://github.com/",
  linkedin: "https://linkedin.com/",
};

describe("admin edits of a member profile", () => {
  it("saves the profile and notifies the member with the changed fields", async () => {
    await updateMemberProfileByAdmin("frontend-lead", profile);
    expect((await getMember("frontend-lead"))?.profile.bio).toBe("Новое описание");
    const [note] = await listNotificationsFor("frontend-lead");
    expect(note.kind).toBe("PROFILE_EDITED_BY_ADMIN");
    expect(note.fields).toEqual(["bio"]);
    expect(note.readAt).toBeUndefined();
  });

  it("does not notify when nothing changed", async () => {
    const current = (await getMember("frontend-lead"))!.profile;
    await updateMemberProfileByAdmin("frontend-lead", {
      ...profile,
      bio: current.bio,
    });
    expect(await listNotificationsFor("frontend-lead")).toHaveLength(0);
  });

  it("changes only the role", async () => {
    await setMemberRole("frontend-dev", "TEAM_LEAD");
    expect((await getMember("frontend-dev"))?.user.role).toBe("TEAM_LEAD");
    await expect(setMemberRole("nobody", "DEVELOPER")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("reads an older store file that has no notifications yet", async () => {
    const db = await readDb();
    const legacy: Partial<typeof db> = { ...db };
    delete legacy.notifications;
    await mkdir(path.dirname(process.env.DB_FILE!), { recursive: true });
    await writeFile(process.env.DB_FILE!, JSON.stringify(legacy), "utf8");
    expect(await listNotificationsFor("frontend-lead")).toEqual([]);
  });
});
