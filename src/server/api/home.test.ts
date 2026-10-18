import { afterEach, describe, expect, it, vi } from "vitest";
import { getTeamLeads } from "./home";
import { getPublicRoster } from "./members";
import { getProjectsWithMembers } from "./projects";
import type { MemberListItem, ProjectDetail } from "./schemas";

vi.mock("./members", () => ({ getPublicRoster: vi.fn() }));
vi.mock("./projects", () => ({ getProjectsWithMembers: vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const lead: MemberListItem = {
  id: 7,
  first_name: "Айбек",
  last_name: "Асанов",
  position: "Backend_Developer",
  avatar: null,
  status: "Active",
};

const project: ProjectDetail = {
  id: 1,
  name: "Motion LMS Platform",
  project_status: "In_progress",
  category: "Education",
  preview_image: null,
  description: "",
  demo_url: null,
  github_url: null,
  created_at: "2026-09-28T00:00:00+06:00",
  members: [{ id: 1, user: 7, role: "Team_Lead" }],
};

describe("getTeamLeads", () => {
  it("returns the leads joined from projects and the roster", async () => {
    vi.mocked(getPublicRoster).mockResolvedValue([lead]);
    vi.mocked(getProjectsWithMembers).mockResolvedValue([project]);
    await expect(getTeamLeads()).resolves.toEqual([lead]);
  });

  it("logs and returns no leads when the roster fails to load", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getPublicRoster).mockRejectedValue(new Error("502"));
    vi.mocked(getProjectsWithMembers).mockResolvedValue([project]);
    await expect(getTeamLeads()).resolves.toEqual([]);
    expect(log).toHaveBeenCalled();
  });
});
