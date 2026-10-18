import { afterEach, describe, expect, it, vi } from "vitest";
import { getTeamLeads } from "./home";
import { getMember, getPublicRoster } from "./members";
import { getProjectsWithMembers } from "./projects";
import type { MemberDetail, MemberListItem, ProjectDetail } from "./schemas";

vi.mock("./members", () => ({ getPublicRoster: vi.fn(), getMember: vi.fn() }));
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

const detail: MemberDetail = {
  ...lead,
  bio: "Ведёт команду LMS.",
  skills: "",
  github: null,
  linkedin: null,
  portfolio: null,
  resume: null,
  projects: [],
};

describe("getTeamLeads", () => {
  it("returns each lead with their bio and projects", async () => {
    vi.mocked(getPublicRoster).mockResolvedValue([lead]);
    vi.mocked(getProjectsWithMembers).mockResolvedValue([project]);
    vi.mocked(getMember).mockResolvedValue(detail);
    await expect(getTeamLeads()).resolves.toEqual([
      {
        member: lead,
        bio: "Ведёт команду LMS.",
        projects: [{ id: 1, name: "Motion LMS Platform", status: "In_progress", role: "Team_Lead" }],
      },
    ]);
  });

  it("keeps a lead whose profile is gone, without a bio", async () => {
    vi.mocked(getPublicRoster).mockResolvedValue([lead]);
    vi.mocked(getProjectsWithMembers).mockResolvedValue([project]);
    vi.mocked(getMember).mockResolvedValue(null);
    const [profile] = await getTeamLeads();
    expect(profile.bio).toBe("");
  });

  it("logs and returns no leads when the roster fails to load", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getPublicRoster).mockRejectedValue(new Error("502"));
    vi.mocked(getProjectsWithMembers).mockResolvedValue([project]);
    await expect(getTeamLeads()).resolves.toEqual([]);
    expect(log).toHaveBeenCalled();
  });

  it("lets Next's dynamic-rendering signal through instead of logging it", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const dynamicUsage = Object.assign(new Error("Dynamic server usage"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    vi.mocked(getPublicRoster).mockRejectedValue(dynamicUsage);
    vi.mocked(getProjectsWithMembers).mockResolvedValue([project]);
    await expect(getTeamLeads()).rejects.toBe(dynamicUsage);
    expect(log).not.toHaveBeenCalled();
  });
});
