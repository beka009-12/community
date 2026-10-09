"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState, useEffect } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import FormSection from "@/src/components/admin/ui/FormSection";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import type { FormState } from "@/src/actions/form-state";
import { POSITIONS } from "@/src/lib/api-enums";
import { POSITION_LABELS } from "@/src/lib/api-labels";

export interface MemberProfileValues {
  login: string;
  first_name: string;
  last_name: string;
  position: string;
  skills: string;
  bio: string;
  github: string;
  linkedin: string;
  portfolio: string;
}

interface MemberProfileFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: MemberProfileValues;
  onSaved?: () => void;
}

const POSITION_OPTIONS = [
  { value: "", label: "Не указано" },
  ...POSITIONS.map((value) => ({ value, label: POSITION_LABELS[value] })),
];

const MemberProfileForm: FC<MemberProfileFormProps> = ({ action, initial, onSaved }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});
  const value = (name: keyof MemberProfileValues) => state.values?.[name] ?? initial[name];
  const control = (name: keyof MemberProfileValues) => ({
    id: `member-${name}`,
    name,
    defaultValue: value(name),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `member-${name}-error` : undefined,
  });

  useEffect(() => {
    if (state.ok) onSaved?.();
  }, [state, onSaved]);

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      <Field label="Логин" htmlFor="member-login" required error={errors.login}>
        <input {...control("login")} autoComplete="off" spellCheck={false} />
      </Field>
      <Field label="Направление" htmlFor="member-position" error={errors.position}>
        <Select
          id="member-position"
          name="position"
          defaultValue={value("position")}
          invalid={Boolean(errors.position)}
          describedBy={errors.position ? "member-position-error" : undefined}
          block
          options={POSITION_OPTIONS}
        />
      </Field>
      <Field label="Имя" htmlFor="member-first_name" required error={errors.first_name}>
        <input {...control("first_name")} />
      </Field>
      <Field label="Фамилия" htmlFor="member-last_name" required error={errors.last_name}>
        <input {...control("last_name")} />
      </Field>
      <Field label="Навыки" htmlFor="member-skills" error={errors.skills} hint="Через запятую" full>
        <input {...control("skills")} />
      </Field>
      <Field label="О себе" htmlFor="member-bio" error={errors.bio} full>
        <textarea {...control("bio")} rows={3} />
      </Field>

      <FormSection title="Ссылки" hint="Необязательно. Пустые ссылки на сайте не показываются." />
      <Field label="GitHub" htmlFor="member-github" error={errors.github}>
        <input {...control("github")} type="url" placeholder="https://github.com/…" />
      </Field>
      <Field label="LinkedIn" htmlFor="member-linkedin" error={errors.linkedin}>
        <input {...control("linkedin")} type="url" placeholder="https://linkedin.com/in/…" />
      </Field>
      <Field label="Портфолио" htmlFor="member-portfolio" error={errors.portfolio}>
        <input {...control("portfolio")} type="url" placeholder="https://…" />
      </Field>

      <FormActions submitLabel="Сохранить" pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default MemberProfileForm;
