import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/server/api/errors";
import { toActionError, toFormError } from "./handle-error";

describe("admin error mapping", () => {
  it("maps DRF field errors onto the form, keeps the values and says why", () => {
    const state = toFormError(
      new ApiError("validation", 400, "", { team_name: "Такая команда уже есть." }),
      { team_name: "A" },
    );
    expect(state).toEqual({
      fieldErrors: { team_name: "Такая команда уже есть." },
      error: "Проверьте поля формы.",
      values: { team_name: "A" },
    });
  });

  it("explains API failures in Russian", () => {
    expect(toFormError(new ApiError("forbidden", 403, "x"), {}).error).toBe(
      "Недостаточно прав для этого действия.",
    );
    expect(toActionError(new ApiError("unavailable", 0, "x")).error).toMatch(/Сервер недоступен/);
  });

  it("logs anything unexpected", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(toFormError(new Error("boom"), {}).error).toBe("Не удалось сохранить. Попробуйте ещё раз.");
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("lets Next's redirects through", () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;push;/login;307;",
    });
    expect(() => toActionError(redirect)).toThrow("NEXT_REDIRECT");
  });
});
