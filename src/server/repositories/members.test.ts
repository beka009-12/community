import { describe, expect, it } from "vitest";
import { setupTempDb } from "./test-db";
import {
  createMember,
  getMember,
  listMembers,
  resetMemberPassword,
  setMemberStatus,
  updateMember,
} from "./members";
import { ConflictError, NotFoundError } from "./errors";
import { verifyPassword } from "@/src/server/auth/password";

setupTempDb();

const input = {
  role: "DEVELOPER" as const,
  firstName: "Тест",
  lastName: "Тестов",
  specializationId: "frontend",
  roleTitle: "Frontend-разработчик",
  stack: "React",
  bio: "",
  skills: [],
};

describe("members repository", () => {
  it("creates a member with a hashed password, id = lowercased login", async () => {
    const created = await createMember({ ...input, login: "New.Dev", password: "pw-123456" });
    expect(created.user.id).toBe("new.dev");
    expect(created.user.passwordHash).not.toContain("pw-123456");
    expect(await verifyPassword("pw-123456", created.user.passwordHash)).toBe(true);
    expect((await getMember("new.dev"))?.profile.firstName).toBe("Тест");
  });

  it("rejects a duplicate login case-insensitively and writes nothing", async () => {
    const before = (await listMembers()).length;
    const attempt = createMember({ ...input, login: "FRONTEND-LEAD", password: "pw-123456" });
    await expect(attempt).rejects.toBeInstanceOf(ConflictError);
    await expect(attempt).rejects.toMatchObject({ field: "login" });
    expect(await listMembers()).toHaveLength(before);
  });

  it("rejects creating a login that is still another member's id after a rename", async () => {
    await updateMember("frontend-dev", { ...input, login: "anna" });
    const attempt = createMember({ ...input, login: "frontend-dev", password: "pw-123456" });
    await expect(attempt).rejects.toMatchObject({ field: "login" });
    expect((await listMembers()).filter((m) => m.user.id === "frontend-dev")).toHaveLength(1);
  });

  it("rejects renaming to a login another member uses", async () => {
    await expect(
      updateMember("frontend-dev", { ...input, login: "backend-dev" }),
    ).rejects.toMatchObject({ field: "login" });
  });

  it("updates profile and role but keeps the id stable", async () => {
    const updated = await updateMember("frontend-dev", {
      ...input,
      login: "frontend-dev",
      role: "TEAM_LEAD",
      firstName: "Новое",
    });
    expect(updated.user.role).toBe("TEAM_LEAD");
    expect(updated.profile.firstName).toBe("Новое");
  });

  it("deactivates, resets password, and 404s unknown ids", async () => {
    await setMemberStatus("qa-dev", "INACTIVE");
    expect((await getMember("qa-dev"))?.user.status).toBe("INACTIVE");
    await resetMemberPassword("qa-dev", "brand-new-pass");
    expect(await verifyPassword("brand-new-pass", (await getMember("qa-dev"))!.user.passwordHash)).toBe(true);
    await expect(setMemberStatus("nobody", "ACTIVE")).rejects.toBeInstanceOf(NotFoundError);
  });
});
