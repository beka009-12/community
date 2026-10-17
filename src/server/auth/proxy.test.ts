import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import type { UserRole } from "@/src/lib/api-enums";
import { refreshTokens, verifyAccess } from "@/src/server/api/auth";
import { ApiError } from "@/src/server/api/errors";
import { signToken } from "./session-token";

vi.mock("@/src/server/api/auth", () => ({ refreshTokens: vi.fn(), verifyAccess: vi.fn() }));

const SECRET = "test-secret-test-secret-test-secret";
const HOUR = 60 * 60 * 1000;
const jwt = (expiresAt: number) =>
  `h.${Buffer.from(JSON.stringify({ exp: Math.floor(expiresAt / 1000) })).toString("base64url")}.s`;

const call = (path: string, cookies: Record<string, string>) =>
  proxy(
    new NextRequest(`http://localhost${path}`, {
      headers: {
        cookie: Object.entries(cookies)
          .map(([name, value]) => `${name}=${value}`)
          .join("; "),
      },
    }),
  );

const signedIn = async (role: UserRole, accessExpiresAt = Date.now() + HOUR) => ({
  mc_access: jwt(accessExpiresAt),
  mc_refresh: jwt(Date.now() + 24 * HOUR),
  mc_session: await signToken({ sub: "7", role, exp: Date.now() + 24 * HOUR }, SECRET),
});

const location = (response: Response) => response.headers.get("location");

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("proxy", () => {
  it("sends anonymous visitors of /admin to /login", async () => {
    expect(location(await call("/admin", {}))).toBe("http://localhost/login");
  });

  it("lets an admin with a fresh token through untouched", async () => {
    const response = await call("/admin/projects", await signedIn("Admin"));
    expect(location(response)).toBeNull();
    expect(refreshTokens).not.toHaveBeenCalled();
    expect(response.cookies.getAll()).toEqual([]);
  });

  it("sends a developer away from /admin", async () => {
    expect(location(await call("/admin", await signedIn("Developer")))).toBe("http://localhost/login");
  });

  it("refreshes an expired access token for this very request", async () => {
    const fresh = jwt(Date.now() + HOUR);
    vi.mocked(refreshTokens).mockResolvedValue({ access: fresh });
    const response = await call("/account", await signedIn("Developer", Date.now() - 1_000));
    expect(location(response)).toBeNull();
    expect(response.cookies.get("mc_access")?.value).toBe(fresh);
    expect(response.headers.get("x-middleware-request-cookie")).toContain(fresh);
  });

  it("drops a session whose refresh is rejected", async () => {
    vi.mocked(refreshTokens).mockRejectedValue(new ApiError("unauthorized", 401, "x"));
    const response = await call("/admin", await signedIn("Admin", Date.now() - 1_000));
    expect(location(response)).toBe("http://localhost/login");
    expect(response.cookies.get("mc_session")?.value).toBe("");
  });

  it("keeps the session when the API is unreachable during refresh", async () => {
    vi.mocked(refreshTokens).mockRejectedValue(new ApiError("unavailable", 0, "x"));
    const response = await call("/admin", await signedIn("Admin", Date.now() + 10_000));
    expect(location(response)).toBeNull();
    expect(response.cookies.getAll()).toEqual([]);
  });

  it("sends a signed-in user from /login to their home after verifying", async () => {
    vi.mocked(verifyAccess).mockResolvedValue(true);
    expect(location(await call("/login", await signedIn("Team_Lead")))).toBe("http://localhost/account");
  });

  it("shows the form when the token was revoked", async () => {
    vi.mocked(verifyAccess).mockResolvedValue(false);
    const response = await call("/login", await signedIn("Admin"));
    expect(location(response)).toBeNull();
    expect(response.cookies.get("mc_access")?.value).toBe("");
  });

  it("ignores a forged session cookie", async () => {
    const response = await call("/admin", { mc_access: jwt(Date.now() + HOUR), mc_session: "forged.sig" });
    expect(location(response)).toBe("http://localhost/login");
  });
});
