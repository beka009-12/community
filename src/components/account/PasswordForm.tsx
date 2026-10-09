"use client";

import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import type { FormState } from "@/src/actions/form-state";

interface PasswordFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}

const PasswordForm: FC<PasswordFormProps> = ({ action }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});

  return (
    <form action={formAction} className={ui.formGrid} noValidate>
      <Field label="Новый пароль" htmlFor="account-password" required error={errors.password} hint="От 8 до 64 символов" full>
        <input
          id="account-password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "account-password-error" : undefined}
        />
      </Field>
      <Field label="Повторите пароль" htmlFor="account-password_repeat" required error={errors.password_repeat} full>
        <input
          id="account-password_repeat"
          name="password_repeat"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password_repeat)}
          aria-describedby={errors.password_repeat ? "account-password_repeat-error" : undefined}
        />
      </Field>
      <FormActions submitLabel="Сменить пароль" pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default PasswordForm;
