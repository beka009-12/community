import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath, updateTag } from "next/cache";
import { changeMyPassword, updateMyProfile } from "@/src/server/api/account";
import { ApiError } from "@/src/server/api/errors";
import { changePasswordAction, updateProfileAction } from "./profile";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/src/server/auth/dal", () => ({ requireRole: vi.fn() }));
vi.mock("@/src/server/api/account", () => ({ updateMyProfile: vi.fn(), changeMyPassword: vi.fn() }));

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("profile actions", () => {
  it("saves the profile without role or login and refreshes the public profile", async () => {
    vi.mocked(updateMyProfile).mockResolvedValue(undefined);
    const state = await updateProfileAction(
      {},
      form({
        first_name: "Анвар",
        last_name: "Касымов",
        position: "Frontend_Developer",
        bio: "",
        skills: "React",
        github: "",
        linkedin: "",
        portfolio: "",
        role: "Admin",
        login: "root",
      }),
    );
    expect(state.ok).toBe(true);
    expect(updateMyProfile).toHaveBeenCalledWith({
      first_name: "Анвар",
      last_name: "Касымов",
      position: "Frontend_Developer",
      bio: "",
      skills: "React",
      github: null,
      linkedin: null,
      portfolio: null,
    });
    expect(updateTag).toHaveBeenCalledWith("members");
    expect(revalidatePath).toHaveBeenCalledWith("/account", "layout");
  });

  it("never calls the API when the passwords differ", async () => {
    const state = await changePasswordAction({}, form({ password: "new-secret-1", password_repeat: "other-secret" }));
    expect(state.fieldErrors?.password_repeat).toBe("Пароли не совпадают");
    expect(changeMyPassword).not.toHaveBeenCalled();
  });

  it("shows the backend's password complaint under the field", async () => {
    vi.mocked(changeMyPassword).mockRejectedValue(
      new ApiError("validation", 400, "", { password: "Пароль слишком простой." }),
    );
    const state = await changePasswordAction({}, form({ password: "password1", password_repeat: "password1" }));
    expect(state).toEqual({
      fieldErrors: { password: "Пароль слишком простой." },
      error: "Проверьте поля формы.",
      values: {},
    });
  });
});
