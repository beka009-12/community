import { afterEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { getAccountWithToken, loginWithPassword } from "@/src/server/api/auth";
import { ApiError } from "@/src/server/api/errors";
import { startSession } from "@/src/server/auth/session";
import { login } from "./auth";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  }),
}));
vi.mock("@/src/server/api/auth", () => ({
  loginWithPassword: vi.fn(),
  getAccountWithToken: vi.fn(),
  logoutFromApi: vi.fn(),
}));
vi.mock("@/src/server/auth/session", () => ({
  startSession: vi.fn(),
  readTokens: vi.fn(),
  endSession: vi.fn(),
}));

const form = (login: string, password: string) => {
  const data = new FormData();
  data.set("login", login);
  data.set("password", password);
  return data;
};

const account = (role: "Admin" | "Developer", status: "Active" | "Inactive" = "Active") => ({
  id: 7,
  login: "anvar",
  role,
  status,
  first_name: "",
  last_name: "",
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("login", () => {
  it("validates before calling the API", async () => {
    await expect(login({}, form("", ""))).resolves.toMatchObject({
      fieldErrors: { login: "Введите логин", password: "Введите пароль" },
    });
    expect(loginWithPassword).not.toHaveBeenCalled();
  });

  it("reports wrong credentials", async () => {
    vi.mocked(loginWithPassword).mockRejectedValue(new ApiError("unauthorized", 401, "x"));
    await expect(login({}, form("anvar", "nope"))).resolves.toEqual({
      error: "Неверный логин или пароль.",
      login: "anvar",
    });
  });

  it("reports an unreachable server", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(loginWithPassword).mockRejectedValue(new ApiError("unavailable", 0, "x"));
    await expect(login({}, form("anvar", "pw"))).resolves.toMatchObject({
      error: "Сервер недоступен, попробуйте позже.",
    });
  });

  it("refuses inactive accounts without starting a session", async () => {
    vi.mocked(loginWithPassword).mockResolvedValue({ access: "a", refresh: "r" });
    vi.mocked(getAccountWithToken).mockResolvedValue(account("Developer", "Inactive"));
    await expect(login({}, form("anvar", "pw"))).resolves.toMatchObject({
      error: "Аккаунт отключён. Обратитесь к администратору.",
    });
    expect(startSession).not.toHaveBeenCalled();
  });

  it.each([
    ["Admin", "/admin"],
    ["Developer", "/account"],
  ] as const)("signs a %s in and sends them to %s", async (role, home) => {
    vi.mocked(loginWithPassword).mockResolvedValue({ access: "a", refresh: "r" });
    vi.mocked(getAccountWithToken).mockResolvedValue(account(role));
    await expect(login({}, form(" anvar ", "pw"))).rejects.toThrow(`NEXT_REDIRECT ${home}`);
    expect(loginWithPassword).toHaveBeenCalledWith("anvar", "pw");
    expect(startSession).toHaveBeenCalledWith({ access: "a", refresh: "r", userId: 7, role });
    expect(redirect).toHaveBeenCalledWith(home);
  });
});
