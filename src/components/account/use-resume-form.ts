import { useActionState, useEffect, useId } from "react";
import type { FormState } from "@/src/actions/form-state";

export type ResumeAction = (prev: FormState, formData: FormData) => Promise<FormState>;

// Shared wiring of the four résumé forms: action state, values echoed back
// after a failed save, unique ids (several dialogs share one page) and
// closing the dialog once the row is saved.
export function useResumeForm<V extends { [K in keyof V]: string }>(
  action: ResumeAction,
  initial: V,
  onSaved: () => void,
) {
  const [state, formAction, pending] = useActionState(action, {});
  const uid = useId();
  const errors = pending ? {} : (state.fieldErrors ?? {});

  useEffect(() => {
    if (state.ok) onSaved();
  }, [state, onSaved]);

  const id = (name: keyof V & string) => `${uid}-${name}`;
  const value = (name: keyof V & string): string => state.values?.[name] ?? initial[name];
  const control = (name: keyof V & string) => ({
    id: id(name),
    name,
    defaultValue: value(name),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${id(name)}-error` : undefined,
  });

  return { state, formAction, pending, errors, id, value, control };
}
