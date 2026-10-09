"use server";

import { redirect } from "next/navigation";
import { getAccountWithToken, loginWithPassword, logoutFromApi } from "@/src/server/api/auth";
import { isApiError } from "@/src/server/api/errors";
import { LOGIN_PATH, homeFor } from "@/src/server/auth/routes";
import { endSession, readTokens, startSession } from "@/src/server/auth/session";

export interface LoginFieldErrors {
  login?: string;
  password?: string;
}

export interface LoginState {
  error?: string;
  fieldErrors?: LoginFieldErrors;
  // Echoed back so the login field survives React's post-action form reset.
  login?: string;
}

const MAX_LENGTH = 128;

const validate = (login: string, password: string): LoginFieldErrors => {
  const errors: LoginFieldErrors = {};
  if (!login) errors.login = "Введите логин";
  else if (login.length > MAX_LENGTH) errors.login = "Слишком длинный логин";
  if (!password) errors.password = "Введите пароль";
  else if (password.length > MAX_LENGTH) errors.password = "Слишком длинный пароль";
  return errors;
};

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rawLogin = formData.get("login");
  const rawPassword = formData.get("password");
  if (typeof rawLogin !== "string" || typeof rawPassword !== "string") {
    return { error: "Не удалось отправить форму. Обновите страницу и попробуйте снова." };
  }

  const loginValue = rawLogin.trim();
  const fieldErrors = validate(loginValue, rawPassword);
  if (fieldErrors.login || fieldErrors.password) return { fieldErrors, login: loginValue };

  let home: string;
  try {
    const tokens = await loginWithPassword(loginValue, rawPassword);
    const account = await getAccountWithToken(tokens.access);
    if (account.status === "Inactive") {
      return { error: "Аккаунт отключён. Обратитесь к администратору.", login: loginValue };
    }
    await startSession({
      access: tokens.access,
      refresh: tokens.refresh,
      userId: account.id,
      role: account.role,
    });
    home = homeFor(account.role);
  } catch (error) {
    if (isApiError(error, "unauthorized") || isApiError(error, "validation")) {
      return { error: "Неверный логин или пароль.", login: loginValue };
    }
    console.error("Login failed", error);
    return { error: "Сервер недоступен, попробуйте позже.", login: loginValue };
  }
  redirect(home);
}

export async function logout(): Promise<void> {
  const { access, refresh } = await readTokens();
  try {
    await logoutFromApi(access, refresh);
  } catch (error) {
    // The session ends here either way.
    console.error("API logout failed", error);
  }
  await endSession();
  redirect(LOGIN_PATH);
}
