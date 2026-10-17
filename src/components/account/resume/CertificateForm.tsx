"use client";

import { FC } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import ResumeItemDialog, { type ResumeDialogProps } from "../ResumeItemDialog";
import { useResumeForm, type ResumeAction } from "../use-resume-form";
import type { CertificateValues } from "./resume-values";

interface CertificateFormProps {
  action: ResumeAction;
  initial: CertificateValues;
  onSaved: () => void;
}

const CertificateForm: FC<CertificateFormProps> = ({ action, initial, onSaved }) => {
  const { state, formAction, pending, errors, id, control } = useResumeForm(action, initial, onSaved);

  return (
    <form action={formAction} className={ui.formGrid} noValidate>
      <Field label="Название" htmlFor={id("title")} required error={errors.title}>
        <input {...control("title")} />
      </Field>
      <Field label="Организация" htmlFor={id("organization")} required error={errors.organization}>
        <input {...control("organization")} />
      </Field>
      <Field label="Дата выдачи" htmlFor={id("given_date")} required error={errors.given_date}>
        <input {...control("given_date")} type="date" />
      </Field>
      <Field label="Описание" htmlFor={id("text")} required error={errors.text} full>
        <textarea {...control("text")} rows={3} />
      </Field>
      <FormActions submitLabel="Сохранить" pending={pending} error={state.error} />
    </form>
  );
};

const CertificateDialog: FC<ResumeDialogProps<CertificateValues>> = ({ action, initial, ...dialog }) => (
  <ResumeItemDialog {...dialog}>
    {(onSaved) => <CertificateForm action={action} initial={initial} onSaved={onSaved} />}
  </ResumeItemDialog>
);

export default CertificateDialog;
