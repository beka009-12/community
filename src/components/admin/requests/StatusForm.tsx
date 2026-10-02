"use client";

import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import { REQUEST_STATUS_LABELS } from "@/src/components/admin/labels";
import type { FormState } from "@/src/actions/admin/form-state";
import type { RequestStatus } from "@/src/server/db/types";

interface StatusFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  status: RequestStatus;
}

const StatusForm: FC<StatusFormProps> = ({ action, status }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const error = pending ? undefined : state.fieldErrors?.status;

  return (
    <form action={formAction}>
      <Field label="Статус заявки" htmlFor="request-status" error={error}>
        <select
          id="request-status"
          name="status"
          defaultValue={status}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "request-status-error" : undefined}
        >
          {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <FormActions submitLabel="Сохранить статус" pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default StatusForm;
