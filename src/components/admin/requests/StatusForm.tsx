"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import type { FormState } from "@/src/actions/admin/form-state";
import { REQUEST_STATUSES, type RequestStatus } from "@/src/lib/api-enums";
import { REQUEST_STATUS_LABELS } from "@/src/lib/api-labels";

interface StatusFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  status: RequestStatus;
}

const OPTIONS = REQUEST_STATUSES.map((value) => ({ value, label: REQUEST_STATUS_LABELS[value] }));

const StatusForm: FC<StatusFormProps> = ({ action, status }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const error = pending ? undefined : state.fieldErrors?.status;

  return (
    <form action={formAction}>
      <Field label="Статус заявки" htmlFor="request-status" error={error}>
        <Select
          id="request-status"
          name="status"
          defaultValue={status}
          invalid={Boolean(error)}
          describedBy={error ? "request-status-error" : undefined}
          block
          options={OPTIONS}
        />
      </Field>
      <FormActions submitLabel="Сохранить статус" pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default StatusForm;
