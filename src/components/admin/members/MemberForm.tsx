"use client";

import { FC, useActionState, useEffect, useRef } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import FormSection from "@/src/components/admin/ui/FormSection";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { generatePasswordAction } from "@/src/actions/admin/members";
import type { FormState } from "@/src/actions/admin/form-state";
import { SPECIALIZATIONS } from "@/src/data/specializations";

export interface MemberFormValues {
  login: string;
  role: string;
  firstName: string;
  lastName: string;
  specializationId: string;
  roleTitle: string;
  stack: string;
  bio: string;
  skills: string;
  github: string;
  linkedin: string;
  portfolio: string;
}

interface MemberFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: MemberFormValues;
  // "create": login, role and password too; "profile": personal data only.
  mode: "create" | "profile";
  submitLabel: string;
  onSaved?: () => void;
}

const MemberForm: FC<MemberFormProps> = ({
  action,
  initial,
  mode,
  submitLabel,
  onSaved,
}) => {
  const [state, formAction, pending] = useActionState(action, {});
  const passwordRef = useRef<HTMLInputElement>(null);
  const errors = pending ? {} : (state.fieldErrors ?? {});
  const value = (name: keyof MemberFormValues | "password") =>
    state.values?.[name] ?? (name === "password" ? "" : initial[name]);
  const control = (name: keyof MemberFormValues | "password") => ({
    id: `member-${name}`,
    name,
    defaultValue: value(name),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `member-${name}-error` : undefined,
  });

  useEffect(() => {
    if (state.ok) onSaved?.();
  }, [state, onSaved]);

  const fillPassword = async () => {
    const password = await generatePasswordAction();
    if (passwordRef.current) {
      passwordRef.current.value = password;
      passwordRef.current.type = "text";
    }
  };

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      {mode === "create" && (
        <>
          <FormSection
            title="Доступ"
            hint="С этими данными участник входит на платформу."
          />
          <Field
            label="Логин"
            htmlFor="member-login"
            required
            error={errors.login}
            hint="Латиница, цифры, . _ -"
          >
            <input
              {...control("login")}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>

          <Field
            label="Роль"
            htmlFor="member-role"
            required
            error={errors.role}
          >
            <select {...control("role")}>
              <option value="DEVELOPER">Разработчик</option>
              <option value="TEAM_LEAD">Тимлид</option>
            </select>
          </Field>

          <Field
            label="Пароль"
            htmlFor="member-password"
            required
            error={errors.password}
            full
          >
            <div style={{ display: "flex", gap: 8 }}>
              <input
                {...control("password")}
                ref={passwordRef}
                type="password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className={scss.smallButton}
                onClick={fillPassword}
              >
                Сгенерировать
              </button>
            </div>
          </Field>
        </>
      )}
      {mode === "create" && (
        <FormSection
          title="Профиль"
          hint="Это видят клиенты на публичной странице участника."
        />
      )}
      <Field
        label="Имя"
        htmlFor="member-firstName"
        required
        error={errors.firstName}
      >
        <input {...control("firstName")} />
      </Field>
      <Field
        label="Фамилия"
        htmlFor="member-lastName"
        required
        error={errors.lastName}
      >
        <input {...control("lastName")} />
      </Field>

      <Field
        label="Направление"
        htmlFor="member-specializationId"
        required
        error={errors.specializationId}
      >
        <select {...control("specializationId")}>
          {SPECIALIZATIONS.map((spec) => (
            <option key={spec.id} value={spec.id}>
              {spec.title}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Должность"
        htmlFor="member-roleTitle"
        required
        error={errors.roleTitle}
        hint="Например, «Тимлид Frontend»"
      >
        <input {...control("roleTitle")} />
      </Field>

      <Field
        label="Стек"
        htmlFor="member-stack"
        error={errors.stack}
        hint="Коротко: React · Next.js"
      >
        <input {...control("stack")} />
      </Field>
      <Field
        label="Навыки"
        htmlFor="member-skills"
        error={errors.skills}
        hint="Через запятую"
      >
        <input {...control("skills")} />
      </Field>

      <Field label="О себе" htmlFor="member-bio" error={errors.bio} full>
        <textarea {...control("bio")} rows={3} />
      </Field>

      <FormSection
        title="Ссылки"
        hint="Необязательно. Пустые ссылки на сайте не показываются."
      />
      <Field label="GitHub" htmlFor="member-github" error={errors.github}>
        <input
          {...control("github")}
          type="url"
          placeholder="https://github.com/…"
        />
      </Field>
      <Field label="LinkedIn" htmlFor="member-linkedin" error={errors.linkedin}>
        <input
          {...control("linkedin")}
          type="url"
          placeholder="https://linkedin.com/in/…"
        />
      </Field>
      <Field
        label="Портфолио"
        htmlFor="member-portfolio"
        error={errors.portfolio}
      >
        <input {...control("portfolio")} type="url" placeholder="https://…" />
      </Field>

      <FormActions
        submitLabel={submitLabel}
        pending={pending}
        error={state.error}
        saved={state.ok}
      />
    </form>
  );
};

export default MemberForm;
