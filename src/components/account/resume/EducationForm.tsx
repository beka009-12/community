"use client";

import { FC, useState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import ResumeItemDialog, { type ResumeDialogProps } from "../ResumeItemDialog";
import { useResumeForm, type ResumeAction } from "../use-resume-form";
import type { EducationValues } from "./resume-values";
import scss from "./Resume.module.scss";

interface EducationFormProps {
  action: ResumeAction;
  initial: EducationValues;
  onSaved: () => void;
}

const EducationForm: FC<EducationFormProps> = ({ action, initial, onSaved }) => {
  const { state, formAction, pending, errors, id, control } = useResumeForm(action, initial, onSaved);
  // Controls whether the end date is asked for at all.
  const [studying, setStudying] = useState(initial.studying_now === "on");

  return (
    <form action={formAction} className={ui.formGrid} noValidate>
      <Field label="Учебное заведение" htmlFor={id("educational_institution")} required error={errors.educational_institution} full>
        <input {...control("educational_institution")} />
      </Field>
      <Field label="Специализация" htmlFor={id("specialization")} required error={errors.specialization} full>
        <input {...control("specialization")} />
      </Field>
      <Field label="Начало" htmlFor={id("start_year")} required error={errors.start_year}>
        <input {...control("start_year")} type="date" />
      </Field>
      {!studying && (
        <Field label="Окончание" htmlFor={id("end_year")} error={errors.end_year}>
          <input {...control("end_year")} type="date" />
        </Field>
      )}
      <div className={`${ui.field} ${ui["field--full"]}`}>
        <label className={scss.check}>
          <input
            type="checkbox"
            name="studying_now"
            defaultChecked={studying}
            onChange={(event) => setStudying(event.target.checked)}
          />
          Учусь сейчас
        </label>
      </div>
      <Field label="Описание" htmlFor={id("responsibilities")} required error={errors.responsibilities} full>
        <textarea {...control("responsibilities")} rows={3} />
      </Field>
      <FormActions submitLabel="Сохранить" pending={pending} error={state.error} />
    </form>
  );
};

const EducationDialog: FC<ResumeDialogProps<EducationValues>> = ({ action, initial, ...dialog }) => (
  <ResumeItemDialog {...dialog}>
    {(onSaved) => <EducationForm action={action} initial={initial} onSaved={onSaved} />}
  </ResumeItemDialog>
);

export default EducationDialog;
