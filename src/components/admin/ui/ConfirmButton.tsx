"use client";

import { FC, useState, useTransition } from "react";
import scss from "./admin-ui.module.scss";

interface ConfirmButtonProps {
  label: string;
  confirmLabel: string;
  onConfirm: () => Promise<{ error?: string }>;
  danger?: boolean;
}

// Two-step inline confirm instead of a modal: the second click is the
// commitment, and "Отмена" sits right next to it.
const ConfirmButton: FC<ConfirmButtonProps> = ({
  label,
  confirmLabel,
  onConfirm,
  danger,
}) => {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      try {
        const result = await onConfirm();
        setError(result.error ?? null);
      } catch {
        setError("Нет связи с сервером. Попробуйте ещё раз.");
      }
      setAsking(false);
    });

  const errorNote = error && (
    <span role="alert" className={scss.field__error}>
      {error}
    </span>
  );

  if (!asking) {
    return (
      <span className={scss.confirm}>
        <button
          type="button"
          className={`${scss.smallButton} ${danger ? scss["smallButton--danger"] : ""}`}
          onClick={() => {
            setError(null);
            setAsking(true);
          }}
        >
          {label}
        </button>
        {errorNote}
      </span>
    );
  }

  return (
    <span className={scss.confirm}>
      <button
        type="button"
        className={`${scss.smallButton} ${danger ? scss["smallButton--dangerSolid"] : scss["smallButton--solid"]}`}
        disabled={pending}
        onClick={confirm}
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
