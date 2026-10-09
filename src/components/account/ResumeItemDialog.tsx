"use client";

import { FC, ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import scss from "@/src/components/admin/members/EditProfileDialog.module.scss";
import type { ResumeAction } from "./use-resume-form";

// Props of the four `<X>Form` dialogs.
export interface ResumeDialogProps<V> {
  triggerLabel: string;
  title: string;
  primary?: boolean;
  action: ResumeAction;
  initial: V;
}

interface ResumeItemDialogProps {
  triggerLabel: string;
  title: string;
  primary?: boolean;
  children: (onSaved: () => void) => ReactNode;
}

// Native <dialog> + showModal(), like the admin's «Изменить профиль».
// `open` is the source of truth and the effect syncs the element, so the
// form's onSaved never touches the ref. The form mounts only while open,
// so each opening starts clean.
const ResumeItemDialog: FC<ResumeItemDialogProps> = ({ triggerLabel, title, primary, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`${ui.smallButton} ${primary ? ui["smallButton--solid"] : ""}`}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        className={scss.dialog}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // A click on the backdrop (the dialog element itself) closes it.
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className={scss.formStep}>
          <div className={scss.formStep__head}>
            <h2 id={titleId} className={scss.title}>
              {title}
            </h2>
            <button type="button" className={scss.close} onClick={close} aria-label="Закрыть">
              ×
            </button>
          </div>
          {open && children(close)}
        </div>
      </dialog>
    </>
  );
};

export default ResumeItemDialog;
