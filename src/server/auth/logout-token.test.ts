import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/server/api/errors";
import { accessForLogout } from "./logout-token";

const NOW = 1_800_000_000_000;

const jwt = (expMs: number) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ exp: expMs / 1000 })).toString("base64url")}.sig`;

const fresh = jwt(NOW + 4 * 60_000);
const expired = jwt(NOW - 60_000);

describe("accessForLogout", () => {
  it("keeps a fresh access token without refreshing", async () => {
    const refresh = vi.fn();
    await expect(accessForLogout({ access: fresh, refresh: "r" }, NOW, refresh)).resolves.toBe(fresh);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("swaps an expired access token for a refreshed one", async () => {
    const refresh = vi.fn().mockResolvedValue({ access: "new-access" });
    await expect(accessForLogout({ access: expired, refresh: "r" }, NOW, refresh)).resolves.toBe("new-access");
    expect(refresh).toHaveBeenCalledWith("r");
  });

  it("refreshes when the access cookie is already gone", async () => {
    const refresh = vi.fn().mockResolvedValue({ access: "new-access" });
    await expect(accessForLogout({ refresh: "r" }, NOW, refresh)).resolves.toBe("new-access");
  });

  it("returns null when the refresh token is dead too", async () => {
    const refresh = vi.fn().mockRejectedValue(new ApiError("unauthorized", 401, "expired"));
    await expect(accessForLogout({ access: expired, refresh: "r" }, NOW, refresh)).resolves.toBeNull();
  });

  it("returns null without a refresh token to fall back on", async () => {
    const refresh = vi.fn();
    await expect(accessForLogout({ access: expired }, NOW, refresh)).resolves.toBeNull();
    await expect(accessForLogout({}, NOW, refresh)).resolves.toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("passes on other refresh failures", async () => {
    const down = new ApiError("unavailable", 0, "down");
    const refresh = vi.fn().mockRejectedValue(down);
    await expect(accessForLogout({ access: expired, refresh: "r" }, NOW, refresh)).rejects.toBe(down);
  });
});
