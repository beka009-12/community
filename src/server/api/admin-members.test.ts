import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./errors";
import { loadMembersSection } from "./admin-members";

vi.mock("./client", () => ({ authedGet: vi.fn(), authedSend: vi.fn(), authedDelete: vi.fn() }));

describe("loadMembersSection", () => {
  it("passes data through", async () => {
    await expect(loadMembersSection(Promise.resolve([1]))).resolves.toEqual({ blocked: false, data: [1] });
  });

  it("reports the Django-admin redirect as blocked", async () => {
    await expect(
      loadMembersSection(Promise.reject(new ApiError("redirected", 302, "GET /admin/members/ → 302"))),
    ).resolves.toEqual({ blocked: true });
  });

  it("rethrows everything else", async () => {
    const error = new ApiError("unavailable", 503, "x");
    await expect(loadMembersSection(Promise.reject(error))).rejects.toBe(error);
  });
});
