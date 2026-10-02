"use server";

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

  // TODO: call POST /auth/login once the backend exists, set the JWT as an
  // httpOnly cookie via `cookies()` and redirect("/dashboard"). Until then
  // every attempt ends in this stub error so the UI states stay visible.
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    error: "Вход станет доступен после подключения сервера.",
    login: loginValue,
  };
}
