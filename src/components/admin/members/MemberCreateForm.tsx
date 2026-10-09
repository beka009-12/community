"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState, useRef } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import FormSection from "@/src/components/admin/ui/FormSection";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { generatePasswordAction } from "@/src/actions/admin/members";
import type { FormState } from "@/src/actions/admin/form-state";
import { USER_ROLES } from "@/src/lib/api-enums";
import { USER_ROLE_LABELS } from "@/src/lib/api-labels";

const ROLE_OPTIONS = USER_ROLES.map((value) => ({ value, label: USER_ROLE_LABELS[value] }));

// POST /admin/members/ takes login, password and role; the profile is
// filled in later (by the member, or via «Изменить профиль»).
const MemberCreateForm: FC<{ action: (prev: FormState, formData: FormData) => Promise<FormState> }> = ({
  action,
}) => {
  const [state, formAction, pending] = useActionState(action, {});
  const passwordRef = useRef<HTMLInputElement>(null);
  const errors = pending ? {} : (state.fieldErrors ?? {});

  const fillPassword = async () => {
    const password = await generatePasswordAction();
    if (passwordRef.current) {
      passwordRef.current.value = password;
      passwordRef.current.type = "text";
    }
  };

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      <FormSection title="Доступ" hint="С этими данными участник входит на платформу." />
      <Field label="Логин" htmlFor="member-login" required error={errors.login} hint="Латиница, цифры, . _ -">
        <input
          id="member-login"
          name="login"
          defaultValue={state.values?.login ?? ""}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(errors.login)}
          aria-describedby={errors.login ? "member-login-error" : undefined}
        />
      </Field>
      <Field label="Роль" htmlFor="member-role" required error={errors.role}>
        <Select
          id="member-role"
          name="role"
          defaultValue={state.values?.role ?? "Developer"}
          invalid={Boolean(errors.role)}
          describedBy={errors.role ? "member-role-error" : undefined}
          block
          options={ROLE_OPTIONS}
        />
      </Field>
      <Field label="Пароль" htmlFor="member-password" required error={errors.password} full>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={passwordRef}
            id="member-password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "member-password-error" : undefined}
          />
          <button type="button" className={scss.smallButton} onClick={fillPassword}>
            Сгенерировать
          </button>
        </div>
      </Field>
      <FormActions submitLabel="Создать участника" pending={pending} error={state.error} />
    </form>
  );
};

export default MemberCreateForm;
