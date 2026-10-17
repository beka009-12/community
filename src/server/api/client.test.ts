import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError } from "./errors";
import { request, requestNoContent } from "./http";
import { authedDelete, authedGet, authedSend, publicGet } from "./client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  }),
}));
vi.mock("./http", () => ({ request: vi.fn(), requestNoContent: vi.fn() }));

const schema = z.object({ id: z.number() });

const signedIn = (token?: string) => {
  const store = {
    get: (name: string) => (name === "mc_access" && token ? { name, value: token } : undefined),
  };
  vi.mocked(cookies).mockResolvedValue(store as unknown as Awaited<ReturnType<typeof cookies>>);
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("publicGet", () => {
  it("caches for 60 s under its tag and never sends a token", async () => {
    vi.mocked(request).mockResolvedValue({ id: 1 });
    await publicGet("/members/", schema, "members");
    expect(request).toHaveBeenCalledWith("/members/", schema, {
      next: { revalidate: 60, tags: ["members"] },
    });
  });
});

describe("authed calls", () => {
  it("send the access token uncached", async () => {
    signedIn("t0k");
    vi.mocked(request).mockResolvedValue({ id: 1 });
    await authedGet("/teams/", schema);
    await authedSend("PATCH", "/teams/1/", { team_name: "A" }, schema);
    expect(request).toHaveBeenNthCalledWith(1, "/teams/", schema, { token: "t0k", cache: "no-store" });
    expect(request).toHaveBeenNthCalledWith(2, "/teams/1/", schema, {
      method: "PATCH",
      body: { team_name: "A" },
      token: "t0k",
      cache: "no-store",
    });
  });

  it("delete without a body", async () => {
    signedIn("t0k");
    vi.mocked(requestNoContent).mockResolvedValue(undefined);
    await authedDelete("/teams/1/");
    expect(requestNoContent).toHaveBeenCalledWith("/teams/1/", {
      method: "DELETE",
      token: "t0k",
      cache: "no-store",
    });
  });

  it("redirect to /login without a token", async () => {
    signedIn(undefined);
    await expect(authedGet("/teams/", schema)).rejects.toThrow("NEXT_REDIRECT /login");
    expect(request).not.toHaveBeenCalled();
  });

  it("redirect to /login when the API rejects the token", async () => {
    signedIn("old");
    vi.mocked(request).mockRejectedValue(new ApiError("unauthorized", 401, "GET /teams/ → 401"));
    await expect(authedGet("/teams/", schema)).rejects.toThrow("NEXT_REDIRECT /login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("rethrow every other API error", async () => {
    signedIn("t0k");
    const error = new ApiError("forbidden", 403, "GET /teams/ → 403");
    vi.mocked(request).mockRejectedValue(error);
    await expect(authedGet("/teams/", schema)).rejects.toBe(error);
  });
});
