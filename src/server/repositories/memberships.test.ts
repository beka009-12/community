import { describe, expect, it } from "vitest";
import { setupTempDb } from "./test-db";
import {
  createProject,
  getProject,
  removeProjectMember,
  upsertProjectMember,
} from "./projects";
import { createTeam, getTeam, upsertTeamMember } from "./teams";
import { ConflictError, NotFoundError } from "./errors";

setupTempDb();

describe("memberships", () => {
  it("adding the same user twice updates the role instead of duplicating", async () => {
    await upsertProjectMember("amanat", "qa-dev", "DEVELOPER");
    await upsertProjectMember("amanat", "qa-dev", "TEAM_LEAD");
    const rows = (await getProject("amanat"))!.members.filter(
      (member) => member.user.id === "qa-dev",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].membershipRole).toBe("TEAM_LEAD");
  });

  it("removes a project member", async () => {
    await removeProjectMember("amanat", "backend-dev");
    const ids = (await getProject("amanat"))!.members.map((m) => m.user.id);
    expect(ids).not.toContain("backend-dev");
  });

  it("throws NotFoundError for an unknown user or team", async () => {
    await expect(upsertTeamMember("amanat", "nobody", "DEVELOPER")).rejects.toBeInstanceOf(NotFoundError);
    await expect(upsertTeamMember("no-team", "qa-dev", "DEVELOPER")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("creates a team and adds members to it", async () => {
    const team = await createTeam({ name: "Новая", description: "" });
    await upsertTeamMember(team.id, "qa-dev", "DEVELOPER");
    expect((await getTeam(team.id))!.members.map((m) => m.user.id)).toEqual(["qa-dev"]);
  });

  it("rejects a duplicate project slug", async () => {
    const existing = (await getProject("amanat"))!.project;
    await expect(createProject({ ...existing })).rejects.toBeInstanceOf(ConflictError);
  });
});
