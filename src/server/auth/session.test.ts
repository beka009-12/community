import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { endSession, readSession, startSession } from "./session";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

class FakeCookies {
  values = new Map<string, { value: string; options?: unknown }>();
  get = (name: string) => {
    const entry = this.values.get(name);
    return entry ? { name, value: entry.value } : undefined;
  };
  set = (name: string, value: string, options?: unknown) => {
    this.values.set(name, { value, options });
  };
  delete = (name: string) => {
    this.values.delete(name);
  };
}

const jwt = (exp: number) => `h.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.s`;

let jar: FakeCookies;

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret-test-secret-test-secret");
  jar = new FakeCookies();
  vi.mocked(cookies).mockResolvedValue(jar as unknown as Awaited<ReturnType<typeof cookies>>);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session", () => {
  it("keeps each token until its own exp and signs the role", async () => {
    const access = jwt(2_000_000_000);
    const refresh = jwt(2_000_086_400);
    await startSession({ access, refresh, userId: 7, role: "Developer" });
    expect(jar.values.get("mc_access")).toMatchObject({
      value: access,
      options: { httpOnly: true, sameSite: "lax", expires: new Date(2_000_000_000_000) },
    });
    expect(jar.values.get("mc_refresh")).toMatchObject({
      value: refresh,
      options: { expires: new Date(2_000_086_400_000) },
    });
    await expect(readSession()).resolves.toMatchObject({
      sub: "7",
      role: "Developer",
      exp: 2_000_086_400_000,
    });
  });

  it("ends every auth cookie", async () => {
    await startSession({ access: jwt(2_000_000_000), userId: 1, role: "Admin" });
    await endSession();
    expect([...jar.values.keys()]).toEqual([]);
  });
});
