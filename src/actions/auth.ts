"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/src/server/auth/session";

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

// Compare fixed-length digests so timing doesn't leak how much matched.
const digest = (value: string) => createHash("sha256").update(value).digest();
const safeEqual = (a: string, b: string) =>
  timingSafeEqual(digest(a), digest(b));

const validate = (login: string, password: string): LoginFieldErrors => {
  const errors: LoginFieldErrors = {};
  if (!login) errors.login = "Введите логин";
  else if (login.length > MAX_LENGTH) errors.login = "Слишком длинный логин";
  if (!password) errors.password = "Введите пароль";
  else if (password.length > MAX_LENGTH) errors.password = "Слишком длинный пароль";
  return errors;
};

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawLogin = formData.get("login");
  const rawPassword = formData.get("password");

  if (typeof rawLogin !== "string" || typeof rawPassword !== "string") {
    return { error: "Не удалось отправить форму. Обновите страницу и попробуйте снова." };
  }

  const loginValue = rawLogin.trim();
  const fieldErrors = validate(loginValue, rawPassword);
  if (fieldErrors.login || fieldErrors.password) {
    return { fieldErrors, login: loginValue };
  }

  // Admin credentials come from .env; member accounts will be checked
  // against the store once member dashboards exist.
  const adminLogin = process.env.ADMIN_LOGIN;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminLogin || !adminPassword) {
    console.error("ADMIN_LOGIN / ADMIN_PASSWORD are not set");
    return { error: "Вход временно недоступен.", login: loginValue };
  }

  const valid =
    safeEqual(loginValue, adminLogin) && safeEqual(rawPassword, adminPassword);
  if (!valid) {
    return { error: "Неверный логин или пароль.", login: loginValue };
  }

  await createSession({ sub: "admin", role: "ADMIN" });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
