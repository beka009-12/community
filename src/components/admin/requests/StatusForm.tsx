"use client";

import Select from "@/src/ui/Select";
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
        <Select
          id="request-status"
          name="status"
          defaultValue={status}
          invalid={Boolean(error)}
          describedBy={error ? "request-status-error" : undefined}
          block
          options={Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </Field>
      <FormActions submitLabel="Сохранить статус" pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default StatusForm;
