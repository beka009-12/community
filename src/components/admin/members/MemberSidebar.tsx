"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState, useState, useTransition } from "react";
import Link from "next/link";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import DeleteButton from "@/src/components/admin/ui/DeleteButton";
import Panel from "@/src/components/admin/ui/Panel";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { formatDate } from "@/src/components/admin/labels";
import {
  deleteMemberAction,
  resetPasswordAction,
  setMemberStatusAction,
} from "@/src/actions/admin/members";
import type { FormState } from "@/src/actions/admin/form-state";
import { USER_ROLES, type UserRole, type UserStatus } from "@/src/lib/api-enums";
import { USER_ROLE_LABELS, USER_STATUS_LABELS, USER_STATUS_TONE } from "@/src/lib/api-labels";

interface MemberSidebarProps {
  id: number;
  login: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  roleAction: (prev: FormState, formData: FormData) => Promise<FormState>;
}

const ROLE_OPTIONS = USER_ROLES.map((value) => ({ value, label: USER_ROLE_LABELS[value] }));

const RoleForm: FC<{ role: UserRole; action: MemberSidebarProps["roleAction"] }> = ({ role, action }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const error = pending ? undefined : (state.error ?? state.fieldErrors?.role);
  return (
    <form action={formAction} className={scss.roleForm}>
      <label htmlFor="member-role-select" className={scss.visuallyHidden}>
        Роль
      </label>
      <div className={scss.roleForm__select}>
        <Select
          id="member-role-select"
          name="role"
          defaultValue={role}
          key={JSON.stringify(state)}
          block
          options={ROLE_OPTIONS}
        />
      </div>
      <button type="submit" className={scss.smallButton} disabled={pending}>
        {pending ? "…" : "Сохранить"}
      </button>
      {state.ok && !pending && <span className={scss.saved}>Сохранено</span>}
      {error && (
        <span role="alert" className={scss.field__error}>
          {error}
        </span>
      )}
    </form>
  );
};

const MemberSidebar: FC<MemberSidebarProps> = ({ id, login, status, role, createdAt, roleAction }) => {
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const active = status === "Active";

  const reset = () =>
    startTransition(async () => {
      const result = await resetPasswordAction(id);
      setPassword(result.password ?? null);
      setError(result.error ?? null);
    });

  return (
    <div>
      <Panel title="Роль">
        <RoleForm role={role} action={roleAction} />
      </Panel>

      <Panel title="Статус">
        <p style={{ marginBottom: 12 }}>
          <StatusBadge tone={USER_STATUS_TONE[status]}>{USER_STATUS_LABELS[status]}</StatusBadge>
        </p>
        <ConfirmButton
          label={active ? "Деактивировать" : "Активировать"}
          confirmLabel={active ? "Да, деактивировать" : "Да, активировать"}
          danger={active}
          onConfirm={() => setMemberStatusAction(id, active ? "Inactive" : "Active")}
        />
        {active && (
          <p className={scss.field__hint} style={{ marginTop: 8 }}>
            Неактивный участник скрыт на сайте; история проектов сохраняется.
          </p>
        )}
      </Panel>

      <Panel title="Доступ">
        <dl className={scss.meta}>
          <div>
            <dt>Логин</dt>
            <dd>{login}</dd>
          </div>
          <div>
            <dt>Создан</dt>
            <dd>{formatDate(createdAt)}</dd>
          </div>
        </dl>
        <div style={{ marginTop: 12 }}>
          <button type="button" className={scss.smallButton} onClick={reset} disabled={pending}>
            {pending ? "Сбрасываем…" : "Сбросить пароль"}
          </button>
        </div>
        {password && (
          <p className={scss.notice} style={{ marginTop: 12, marginBottom: 0 }} role="status">
            Новый пароль: <strong>{password}</strong>
            <br />
            Передайте его участнику — повторно он не показывается.
          </p>
        )}
        {error && (
          <p role="alert" className={scss.field__error} style={{ marginTop: 8 }}>
            {error}
          </p>
        )}
      </Panel>

      {active && (
        <Panel>
          <Link href={`/team/${id}`} target="_blank" className={scss.table__link}>
            Открыть публичный профиль ↗
          </Link>
        </Panel>
      )}

      <Panel title="Удаление">
        <DeleteButton
          label="Удалить участника"
          confirmLabel="Да, удалить"
          action={deleteMemberAction.bind(null, id)}
        />
      </Panel>
    </div>
  );
};

export default MemberSidebar;
