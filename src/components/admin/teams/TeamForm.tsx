"use client";

import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import type { FormState } from "@/src/actions/admin/form-state";

export interface TeamFormValues {
  team_name: string;
  description: string;
}

interface TeamFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: TeamFormValues;
  submitLabel: string;
}

const TeamForm: FC<TeamFormProps> = ({ action, initial, submitLabel }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});
  const value = (name: keyof TeamFormValues) => state.values?.[name] ?? initial[name];

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      <Field label="Название" htmlFor="team-team_name" required error={errors.team_name} full>
        <input
          id="team-team_name"
          name="team_name"
          defaultValue={value("team_name")}
          aria-invalid={Boolean(errors.team_name)}
          aria-describedby={errors.team_name ? "team-team_name-error" : undefined}
        />
      </Field>
      <Field label="Описание" htmlFor="team-description" error={errors.description} full>
        <textarea
          id="team-description"
          name="description"
          rows={3}
          defaultValue={value("description")}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "team-description-error" : undefined}
        />
      </Field>
      <FormActions submitLabel={submitLabel} pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default TeamForm;
