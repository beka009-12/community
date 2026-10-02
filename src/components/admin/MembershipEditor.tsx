"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState } from "react";
import Link from "next/link";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { MEMBERSHIP_LABELS } from "@/src/components/admin/labels";
import type { ActionResult, FormState } from "@/src/actions/admin/form-state";
import type { MembershipRole } from "@/src/server/db/types";

export interface MembershipRow {
  userId: string;
  name: string;
  roleTitle: string;
  active: boolean;
  membershipRole: MembershipRole;
}

export interface Candidate {
  userId: string;
  name: string;
}

interface MembershipEditorProps {
  rows: MembershipRow[];
  candidates: Candidate[];
  upsertAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  removeAction: (userId: string) => Promise<ActionResult>;
}

const ROLE_OPTIONS = (Object.entries(MEMBERSHIP_LABELS) as [MembershipRole, string][]).map(
  ([value, label]) => ({ value, label }),
);

// One row per person: changing the role select saves immediately (same
// upsert action as "Добавить"), removal asks for confirmation.
const RoleCell: FC<{
  row: MembershipRow;
  upsertAction: MembershipEditorProps["upsertAction"];
}> = ({ row, upsertAction }) => {
  const [state, formAction, pending] = useActionState(upsertAction, {});
  const error = pending ? undefined : (state.error ?? state.fieldErrors?.role);
  return (
    <form action={formAction} className={scss.roleCell}>
      <input type="hidden" name="userId" value={row.userId} />
      {/* Remount after every response: on failure the select snaps back to
          the saved role instead of showing an unsaved one. */}
      <Select
        key={JSON.stringify(state)}
        name="role"
        defaultValue={row.membershipRole}
        ariaLabel={`Роль: ${row.name}`}
        disabled={pending}
        submitOnChange
        options={ROLE_OPTIONS}
      />
      {error && (
        <span role="alert" className={scss.field__error}>
          {error}
        </span>
      )}
    </form>
  );
};

const MembershipEditor: FC<MembershipEditorProps> = ({
  rows,
  candidates,
  upsertAction,
  removeAction,
}) => {
  const [state, addAction, pending] = useActionState(upsertAction, {});
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
                <p className={scss.field__hint}>
                  {row.roleTitle}
                  {!row.active && " · неактивен"}
                </p>
              </div>
              <RoleCell row={row} upsertAction={upsertAction} />
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

      <form action={addAction} className={scss.membership__add} noValidate>
        <div className={scss.field}>
          <label htmlFor="membership-user">Участник</label>
          {/* Keyed by the last result so a successful add clears the choice. */}
          <Select
            key={JSON.stringify(state)}
            id="membership-user"
            name="userId"
            defaultValue=""
            invalid={Boolean(errors.userId)}
            describedBy={errors.userId ? "membership-user-error" : undefined}
            block
            options={candidates.map((candidate) => ({
              value: candidate.userId,
              label: candidate.name,
            }))}
          />
          {errors.userId && (
            <p id="membership-user-error" className={scss.field__error}>
              {errors.userId}
            </p>
          )}
        </div>
        <div className={scss.field}>
          <label htmlFor="membership-role">Роль</label>
          <Select id="membership-role" name="role" defaultValue="DEVELOPER" block options={ROLE_OPTIONS} />
        </div>
        <button type="submit" className={`${scss.smallButton} ${scss["smallButton--solid"]}`} disabled={pending}>
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
