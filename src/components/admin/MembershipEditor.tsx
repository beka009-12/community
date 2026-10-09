"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState } from "react";
import Link from "next/link";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { MEMBERSHIP_ROLES, type MembershipRole } from "@/src/lib/api-enums";
import { MEMBERSHIP_ROLE_LABELS } from "@/src/lib/api-labels";
import type { ActionResult, FormState } from "@/src/actions/admin/form-state";

export interface MembershipRow {
  userId: number;
  name: string;
  caption: string;
  role: MembershipRole;
}

export interface Candidate {
  userId: number;
  name: string;
}

interface MembershipEditorProps {
  rows: MembershipRow[];
  candidates: Candidate[];
  addAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  removeAction: (userId: number) => Promise<ActionResult>;
}

const ROLE_OPTIONS = MEMBERSHIP_ROLES.map((value) => ({ value, label: MEMBERSHIP_ROLE_LABELS[value] }));

// The API can add and remove people but can't change a role in place, so
// the role is a badge: to change it, remove the person and add them again.
const MembershipEditor: FC<MembershipEditorProps> = ({ rows, candidates, addAction, removeAction }) => {
  const [state, formAction, pending] = useActionState(addAction, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});

  return (
    <div className={scss.membership}>
      {rows.length === 0 ? (
        <p className={scss.empty}>Пока никого нет — добавьте участников ниже.</p>
      ) : (
        <ul className={scss.membership__list}>
          {rows.map((row) => (
            <li key={row.userId} className={scss.membership__row}>
              <div>
                <Link href={`/admin/members/${row.userId}`} className={scss.table__link}>
                  {row.name}
                </Link>
                {row.caption && <p className={scss.field__hint}>{row.caption}</p>}
              </div>
              <StatusBadge tone={row.role === "Team_Lead" ? "accent" : "neutral"}>
                {MEMBERSHIP_ROLE_LABELS[row.role]}
              </StatusBadge>
              <ConfirmButton
                label="Убрать"
                confirmLabel="Да, убрать"
                danger
                onConfirm={() => removeAction(row.userId)}
              />
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className={scss.membership__add} noValidate>
        <div className={scss.field}>
          <label htmlFor="membership-user">Участник</label>
          {/* Keyed by the last result so a successful add clears the choice. */}
          <Select
            key={JSON.stringify(state)}
            id="membership-user"
            name="user"
            defaultValue=""
            invalid={Boolean(errors.user)}
            describedBy={errors.user ? "membership-user-error" : undefined}
            block
            options={candidates.map((candidate) => ({
              value: String(candidate.userId),
              label: candidate.name,
            }))}
          />
          {errors.user && (
            <p id="membership-user-error" className={scss.field__error}>
              {errors.user}
            </p>
          )}
        </div>
        <div className={scss.field}>
          <label htmlFor="membership-role">Роль</label>
          <Select id="membership-role" name="role" defaultValue="Developer" block options={ROLE_OPTIONS} />
        </div>
        <button
          type="submit"
          className={`${scss.smallButton} ${scss["smallButton--solid"]}`}
          disabled={pending}
        >
          {pending ? "Добавляем…" : "Добавить"}
        </button>
        {state.error && !pending && (
          <p role="alert" className={scss.field__error}>
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
};

export default MembershipEditor;
