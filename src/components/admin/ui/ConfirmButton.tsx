"use client";

import { FC, useState, useTransition } from "react";
import scss from "./admin-ui.module.scss";

interface ConfirmButtonProps {
  label: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  danger?: boolean;
}

// Two-step inline confirm instead of a modal: the second click is the
// commitment, and "Отмена" sits right next to it.
const ConfirmButton: FC<ConfirmButtonProps> = ({ label, confirmLabel, onConfirm, danger }) => {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!asking) {
    return (
      <button
        type="button"
        className={`${scss.smallButton} ${danger ? scss["smallButton--danger"] : ""}`}
        onClick={() => setAsking(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <span className={scss.confirm}>
      <button
        type="button"
        className={`${scss.smallButton} ${danger ? scss["smallButton--dangerSolid"] : scss["smallButton--solid"]}`}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await onConfirm();
            setAsking(false);
          })
        }
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
    </span>
  );
};

export default ConfirmButton;
