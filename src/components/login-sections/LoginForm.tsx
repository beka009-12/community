"use client";

import { FC, KeyboardEvent, useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import Button from "@/src/ui/Button";
import { login, type LoginState } from "@/src/actions/auth";
import { SOCIAL_LINKS } from "@/src/data/socials";
import { springs } from "@/src/lib/motion-tokens";
import scss from "./LoginForm.module.scss";

const TELEGRAM = SOCIAL_LINKS.find((link) => link.label === "Telegram");

const INITIAL_STATE: LoginState = {};

const EyeIcon: FC<{ open: boolean }> = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {open ? (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M10.7 5.1A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.2" />
        <path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        <path d="m2 2 20 20" />
      </>
    )}
  </svg>
);

const LoginForm: FC = () => {
  const [state, formAction, pending] = useActionState(login, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const handlePasswordKey = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState("CapsLock"));
  };

  // Stale errors from the previous attempt hide while the next one runs.
  const loginError = pending ? undefined : state.fieldErrors?.login;
  const passwordError = pending ? undefined : state.fieldErrors?.password;

  return (
    <section className={scss.column}>
      <div className={scss.topbar}>
        <Link href="/" className={scss.topbar__logo} aria-label="Motion Community — на главную">
          <Image src="/brand/motion-logo.svg" alt="" width={253} height={134} />
        </Link>
        <Link href="/" className={scss.topbar__back}>
          ← На сайт
        </Link>
      </div>

      <div className={scss.content}>
        <h1 className={scss.title}>Вход для участников</h1>
        <p className={scss.lead}>
          Введите логин и пароль, которые выдал администратор.
        </p>

        <form action={formAction} className={scss.form} noValidate>
          <div className={scss.field}>
            <label htmlFor="login">Логин</label>
            <input
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              defaultValue={state.login}
              aria-invalid={Boolean(loginError)}
              aria-describedby={loginError ? "login-error" : undefined}
              required
            />
            {loginError && (
              <p id="login-error" className={scss.field__error}>
                {loginError}
              </p>
            )}
          </div>

          <div className={scss.field}>
            <label htmlFor="password">Пароль</label>
            <div className={scss.password}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={
                  [passwordError && "password-error", capsLock && "password-caps"]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
                onKeyDown={handlePasswordKey}
                onKeyUp={handlePasswordKey}
                onBlur={() => setCapsLock(false)}
                required
              />
              <button
                type="button"
                className={scss.password__toggle}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                <EyeIcon open={!showPassword} />
              </button>
            </div>
            {passwordError && (
              <p id="password-error" className={scss.field__error}>
                {passwordError}
              </p>
            )}
            {capsLock && (
              <p id="password-caps" className={scss.field__hint}>
                Включён Caps Lock
              </p>
            )}
          </div>

          <div aria-live="polite">
            <AnimatePresence initial={false}>
              {state.error && !pending && (
                <motion.p
                  key={state.error}
                  role="alert"
                  className={scss.alert}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={springs.snappy}
                >
                  {state.error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <Button type="submit" variant="primary" className={scss.submit} disabled={pending} aria-busy={pending}>
            {pending && <span className={scss.spinner} aria-hidden="true" />}
            {pending ? "Входим…" : "Войти"}
          </Button>
        </form>

        <p className={scss.note}>
          Аккаунты создаёт администратор Motion Community. Нет доступа или
          забыли пароль?{" "}
          {TELEGRAM && (
            <a href={TELEGRAM.href} target="_blank" rel="noreferrer">
              Напишите в Telegram
            </a>
          )}
        </p>
      </div>
    </section>
  );
};

export default LoginForm;
