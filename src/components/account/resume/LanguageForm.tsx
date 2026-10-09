"use client";

import { FC } from "react";
import Select from "@/src/ui/Select";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import { LANGUAGE_LEVELS } from "@/src/lib/api-enums";
import ResumeItemDialog, { type ResumeDialogProps } from "../ResumeItemDialog";
import { useResumeForm, type ResumeAction } from "../use-resume-form";
import type { LanguageValues } from "./resume-values";

const LEVEL_OPTIONS = [
  { value: "", label: "Выберите уровень" },
  ...LANGUAGE_LEVELS.map((value) => ({ value, label: value })),
];

interface LanguageFormProps {
  action: ResumeAction;
  initial: LanguageValues;
  onSaved: () => void;
}

const LanguageForm: FC<LanguageFormProps> = ({ action, initial, onSaved }) => {
  const { state, formAction, pending, errors, id, value, control } = useResumeForm(action, initial, onSaved);

  return (
    <form action={formAction} className={ui.formGrid} noValidate>
      <Field label="Язык" htmlFor={id("languages")} required error={errors.languages}>
        <input {...control("languages")} placeholder="Например, английский" />
      </Field>
      <Field label="Уровень" htmlFor={id("Level")} required error={errors.Level}>
        <Select
          id={id("Level")}
          name="Level"
          defaultValue={value("Level")}
          invalid={Boolean(errors.Level)}
          describedBy={errors.Level ? `${id("Level")}-error` : undefined}
          block
          options={LEVEL_OPTIONS}
        />
      </Field>
      <FormActions submitLabel="Сохранить" pending={pending} error={state.error} />
    </form>
  );
};

const LanguageDialog: FC<ResumeDialogProps<LanguageValues>> = ({ action, initial, ...dialog }) => (
  <ResumeItemDialog {...dialog}>
    {(onSaved) => <LanguageForm action={action} initial={initial} onSaved={onSaved} />}
  </ResumeItemDialog>
);

export default LanguageDialog;
