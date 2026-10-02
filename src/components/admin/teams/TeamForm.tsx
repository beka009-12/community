"use client";

import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import type { FormState } from "@/src/actions/admin/form-state";

interface TeamFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: { name: string; description: string };
  submitLabel: string;
}

const TeamForm: FC<TeamFormProps> = ({ action, initial, submitLabel }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});
  const value = (name: "name" | "description") => state.values?.[name] ?? initial[name];

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      <Field label="Название" htmlFor="team-name" required error={errors.name} full>
        <input
          id="team-name"
          name="name"
          defaultValue={value("name")}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "team-name-error" : undefined}
        />
      </Field>
      <Field label="Описание" htmlFor="team-description" error={errors.description} full>
        <textarea id="team-description" name="description" rows={3} defaultValue={value("description")} />
      </Field>
      <FormActions submitLabel={submitLabel} pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default TeamForm;
