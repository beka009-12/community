"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";
import MemberProfileForm, { type MemberProfileValues } from "./MemberProfileForm";
import scss from "./EditProfileDialog.module.scss";
import type { FormState } from "@/src/actions/form-state";

interface EditProfileDialogProps {
  memberName: string;
  initial: MemberProfileValues;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}

// Native <dialog> + showModal(): focus stays inside, Esc closes, the
// rest of the page is inert — no hand-rolled focus trap needed.
const EditProfileDialog: FC<EditProfileDialogProps> = ({ memberName, initial, action }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  // Remounting the form on each opening drops stale errors/values.
  const [formKey, setFormKey] = useState(0);

  const show = () => {
    setSaved(false);
    setFormKey((key) => key + 1);
    setOpen(true);
    dialogRef.current?.showModal();
  };

  const close = useCallback(() => dialogRef.current?.close(), []);

  const handleSaved = useCallback(() => {
    setSaved(true);
    close();
  }, [close]);

  // Lock page scroll while the dialog is up.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button type="button" className={scss.trigger} onClick={show}>
        Изменить профиль
      </button>
      {saved && (
        <p className={scss.saved} role="status">
          Профиль сохранён.
        </p>
      )}

      <dialog
        ref={dialogRef}
        className={scss.dialog}
        aria-labelledby="edit-profile-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Click on the backdrop (the dialog element itself) closes it.
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className={scss.formStep}>
          <div className={scss.formStep__head}>
            <h2 id="edit-profile-title" className={scss.title}>
              Профиль: {memberName}
            </h2>
            <button type="button" className={scss.close} onClick={close} aria-label="Закрыть">
              ×
            </button>
          </div>
          <p className={scss.notice}>
            Профиль обычно заполняет сам участник — меняйте его, только если это действительно нужно.
          </p>
          <MemberProfileForm key={formKey} action={action} initial={initial} onSaved={handleSaved} />
        </div>
      </dialog>
    </>
  );
};

export default EditProfileDialog;
