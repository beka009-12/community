import { describe, expect, it } from "vitest";
import type { MembershipRole } from "@/src/lib/api-enums";
import { myProjects, myTeams } from "./joins";
import type { Membership, ProjectDetail, TeamDetail } from "./schemas";

const row = (user: number, role: MembershipRole): Membership => ({ id: user * 10, user, role });

const project = (id: number, members: Membership[]): ProjectDetail => ({
  id,
  name: `Проект ${id}`,
  project_status: "In_progress",
  category: "Web",
  preview_image: null,
  description: "",
  demo_url: null,
  github_url: null,
  created_at: "2026-09-28T00:00:00+06:00",
  members,
});

const team = (id: number, members: Membership[]): TeamDetail => ({
  id,
  team_name: `Команда ${id}`,
  team_image: null,
  description: "",
  created_at: "2026-09-28T00:00:00+06:00",
  members,
});

describe("my projects and teams", () => {
  it("lists only my projects with my role in each", () => {
    const result = myProjects(
      [project(1, [row(7, "Team_Lead")]), project(2, [row(8, "Developer")]), project(3, [row(8, "Team_Lead"), row(7, "Developer")])],
      7,
    );
    expect(result.map(({ project: item, role }) => [item.id, role])).toEqual([
      [1, "Team_Lead"],
      [3, "Developer"],
    ]);
  });

  it("lists only my teams with my role in each", () => {
    const result = myTeams([team(1, [row(7, "Developer")]), team(2, [row(8, "Team_Lead")])], 7);
    expect(result.map(({ team: item, role }) => [item.id, role])).toEqual([[1, "Developer"]]);
  });

  it("returns nothing for someone in no project or team", () => {
    expect(myProjects([project(1, [row(8, "Developer")])], 7)).toEqual([]);
    expect(myTeams([], 7)).toEqual([]);
  });
});
