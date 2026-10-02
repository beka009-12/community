"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";
import MemberForm, { type MemberFormValues } from "./MemberForm";
import scss from "./EditProfileDialog.module.scss";
import type { FormState } from "@/src/actions/admin/form-state";

interface EditProfileDialogProps {
  memberName: string;
  initial: MemberFormValues;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}

type Step = "warning" | "form";

// Native <dialog> + showModal(): focus stays inside, Esc closes, the
// rest of the page is inert — no hand-rolled focus trap needed.
const EditProfileDialog: FC<EditProfileDialogProps> = ({ memberName, initial, action }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("warning");
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  // Remounting the form on each opening drops stale errors/values.
  const [formKey, setFormKey] = useState(0);

  const show = () => {
    setStep("warning");
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
          Профиль сохранён. Участник получит уведомление об изменениях.
        </p>
      )}

      <dialog
        ref={dialogRef}
        className={`${scss.dialog} ${step === "warning" ? scss["dialog--narrow"] : ""}`}
        aria-labelledby="edit-profile-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Click on the backdrop (the dialog element itself) closes it.
          if (event.target === dialogRef.current) close();
        }}
      >
        {step === "warning" ? (
          <div className={scss.warning}>
            <span className={scss.warning__icon} aria-hidden="true">
              !
            </span>
            <h2 id="edit-profile-title" className={scss.title}>
              Это личные данные участника
            </h2>
            <p className={scss.text}>
              Профиль заполняет сам {memberName}. Если вы измените его, участник
              получит уведомление о том, что администратор внёс правки, и увидит,
              какие поля изменились.
            </p>
            <div className={scss.actions}>
              <button type="button" className={scss.secondary} onClick={close} autoFocus>
                Отмена
              </button>
              <button type="button" className={scss.primary} onClick={() => setStep("form")}>
                Всё равно изменить
              </button>
            </div>
          </div>
        ) : (
          <div className={scss.formStep}>
            <div className={scss.formStep__head}>
              <h2 id="edit-profile-title" className={scss.title}>
                Профиль: {memberName}
              </h2>
              <button type="button" className={scss.close} onClick={close} aria-label="Закрыть">
                ×
              </button>
            </div>
            <p className={scss.notice}>Участник получит уведомление о каждом изменённом поле.</p>
            <MemberForm
              key={formKey}
              action={action}
              initial={initial}
              mode="profile"
              submitLabel="Сохранить и уведомить"
              onSaved={handleSaved}
            />
          </div>
        )}
      </dialog>
    </>
  );
};

export default EditProfileDialog;
