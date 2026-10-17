import { afterEach, describe, expect, it, vi } from "vitest";
import { authedGet } from "./client";
import { ApiError } from "./errors";
import { getTeamsWithMembers } from "./teams";

vi.mock("./client", () => ({ authedGet: vi.fn(), authedSend: vi.fn(), authedDelete: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("teams", () => {
  it("loads every team's details and skips the ones that are gone", async () => {
    vi.mocked(authedGet).mockImplementation((async (path: string) => {
      if (path === "/teams/") {
        return [
          { id: 1, team_name: "Alpha", team_image: null },
          { id: 2, team_name: "Beta", team_image: null },
        ];
      }
      if (path === "/teams/1/") {
        return { id: 1, team_name: "Alpha", team_image: null, description: "", created_at: "2026-09-28", members: [] };
      }
      throw new ApiError("not_found", 404, `GET ${path} → 404`);
    }) as typeof authedGet);

    const teams = await getTeamsWithMembers();
    expect(teams.map((team) => team.id)).toEqual([1]);
  });
});
