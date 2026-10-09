"use client";

import { FC, useActionState, useState } from "react";
import type { ActionResult } from "@/src/actions/admin/form-state";
import scss from "./admin-ui.module.scss";

interface DeleteButtonProps {
  label: string;
  confirmLabel: string;
  action: (prev: ActionResult) => Promise<ActionResult>;
}

// Like ConfirmButton, but the commitment is a real form submit: the
// Server Action redirects away on success, which form actions handle
// natively.
const DeleteButton: FC<DeleteButtonProps> = ({ label, confirmLabel, action }) => {
  const [asking, setAsking] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});
  const error = !pending && state.error;

  return (
    <span className={scss.confirm}>
      {asking ? (
        <form action={formAction} className={scss.confirm}>
          <button
            type="submit"
            className={`${scss.smallButton} ${scss["smallButton--dangerSolid"]}`}
            disabled={pending}
          >
            {pending ? "…" : confirmLabel}
          </button>
          <button
            type="button"
            className={scss.smallButton}
            disabled={pending}
            onClick={() => setAsking(false)}
          >
            Отмена
          </button>
        </form>
      ) : (
        <button
          type="button"
          className={`${scss.smallButton} ${scss["smallButton--danger"]}`}
          onClick={() => setAsking(true)}
        >
          {label}
        </button>
      )}
      {error && (
        <span role="alert" className={scss.field__error}>
          {error}
        </span>
      )}
    </span>
  );
};

export default DeleteButton;
