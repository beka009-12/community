"use client";

import { FC } from "react";
import Select from "@/src/ui/Select";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import { WORKING_FORMATS } from "@/src/lib/api-enums";
import { WORKING_FORMAT_LABELS } from "@/src/lib/api-labels";
import ResumeItemDialog, { type ResumeDialogProps } from "../ResumeItemDialog";
import { useResumeForm, type ResumeAction } from "../use-resume-form";
import type { WorkValues } from "./resume-values";

const FORMAT_OPTIONS = [
  { value: "", label: "Не указан" },
  ...WORKING_FORMATS.map((value) => ({ value, label: WORKING_FORMAT_LABELS[value] })),
];

interface WorkFormProps {
  action: ResumeAction;
  initial: WorkValues;
  onSaved: () => void;
}

const WorkForm: FC<WorkFormProps> = ({ action, initial, onSaved }) => {
  const { state, formAction, pending, errors, id, value, control } = useResumeForm(action, initial, onSaved);

  return (
    <form action={formAction} className={ui.formGrid} noValidate>
      <Field label="Должность" htmlFor={id("position")} required error={errors.position}>
        <input {...control("position")} />
      </Field>
      <Field label="Компания" htmlFor={id("company")} required error={errors.company}>
        <input {...control("company")} />
      </Field>
      <Field label="Начало" htmlFor={id("start_time")} required error={errors.start_time}>
        <input {...control("start_time")} type="date" />
      </Field>
      <Field label="Окончание" htmlFor={id("end_time")} error={errors.end_time} hint="Пусто — работаю сейчас">
        <input {...control("end_time")} type="date" />
      </Field>
      <Field label="Формат работы" htmlFor={id("working_format")} error={errors.working_format} full>
        <Select
          id={id("working_format")}
          name="working_format"
          defaultValue={value("working_format")}
          invalid={Boolean(errors.working_format)}
          describedBy={errors.working_format ? `${id("working_format")}-error` : undefined}
          block
          options={FORMAT_OPTIONS}
        />
      </Field>
      <Field label="Достижения" htmlFor={id("achievements")} required error={errors.achievements} full>
        <textarea {...control("achievements")} rows={4} />
      </Field>
      <FormActions submitLabel="Сохранить" pending={pending} error={state.error} />
    </form>
  );
};

const WorkDialog: FC<ResumeDialogProps<WorkValues>> = ({ action, initial, ...dialog }) => (
  <ResumeItemDialog {...dialog}>
    {(onSaved) => <WorkForm action={action} initial={initial} onSaved={onSaved} />}
  </ResumeItemDialog>
);

export default WorkDialog;
