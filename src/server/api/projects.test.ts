import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./errors";
import { publicGet } from "./client";
import { getProject, getProjectsWithMembers } from "./projects";

vi.mock("./client", () => ({
  publicGet: vi.fn(),
  authedGet: vi.fn(),
  authedSend: vi.fn(),
  authedDelete: vi.fn(),
}));

const listItem = (id: number) => ({
  id,
  name: `Проект ${id}`,
  project_status: "Planned",
  category: "Web",
  preview_image: null,
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("projects", () => {
  it("returns null for a missing project and skips it in the team list", async () => {
    vi.mocked(publicGet).mockImplementation((async (path: string) => {
      if (path === "/projects/") return [listItem(1), listItem(2)];
      if (path === "/projects/1/") return { ...listItem(1), members: [] };
      throw new ApiError("not_found", 404, `GET ${path} → 404`);
    }) as typeof publicGet);

    await expect(getProject(2)).resolves.toBeNull();
    const all = await getProjectsWithMembers();
    expect(all.map((item) => item.id)).toEqual([1]);
  });
});
