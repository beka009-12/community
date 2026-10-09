"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import FormSection from "@/src/components/admin/ui/FormSection";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import type { FormState } from "@/src/actions/form-state";
import { PROJECT_STATUSES } from "@/src/lib/api-enums";
import { PROJECT_STATUS_LABELS } from "@/src/lib/api-labels";

export interface ProjectFormValues {
  name: string;
  description: string;
  project_status: string;
  category: string;
  demo_url: string;
  github_url: string;
}

interface ProjectFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: ProjectFormValues;
  // Existing categories, offered as suggestions: the API takes any text.
  categories: string[];
  submitLabel: string;
}

const STATUS_OPTIONS = PROJECT_STATUSES.map((value) => ({ value, label: PROJECT_STATUS_LABELS[value] }));

const ProjectForm: FC<ProjectFormProps> = ({ action, initial, categories, submitLabel }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});
  const value = (name: keyof ProjectFormValues) => state.values?.[name] ?? initial[name];
  const control = (name: keyof ProjectFormValues) => ({
    id: `project-${name}`,
    name,
    defaultValue: value(name),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `project-${name}-error` : undefined,
  });

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      <FormSection title="О проекте" />
      <Field label="Название" htmlFor="project-name" required error={errors.name}>
        <input {...control("name")} />
      </Field>
      <Field
        label="Категория"
        htmlFor="project-category"
        required
        error={errors.category}
        hint="Например, Web, Mobile, Education"
      >
        <input {...control("category")} list="project-categories" />
        <datalist id="project-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </Field>
      <Field label="Описание" htmlFor="project-description" required error={errors.description} full>
        <textarea {...control("description")} rows={4} />
      </Field>

      <FormSection title="Публикация" hint="Статус виден в портфолио на сайте." />
      <Field label="Статус" htmlFor="project-project_status" required error={errors.project_status}>
        <Select
          id="project-project_status"
          name="project_status"
          defaultValue={value("project_status")}
          invalid={Boolean(errors.project_status)}
          describedBy={errors.project_status ? "project-project_status-error" : undefined}
          block
          options={STATUS_OPTIONS}
        />
      </Field>

      <FormSection title="Ссылки" hint="Необязательно. Пустые ссылки на сайте не показываются." />
      <Field label="Демо" htmlFor="project-demo_url" error={errors.demo_url}>
        <input {...control("demo_url")} type="url" placeholder="https://…" />
      </Field>
      <Field label="GitHub" htmlFor="project-github_url" error={errors.github_url}>
        <input {...control("github_url")} type="url" placeholder="https://github.com/…" />
      </Field>

      <FormActions submitLabel={submitLabel} pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default ProjectForm;
