"use client";

import { FC, useActionState, useState, useTransition } from "react";
import Link from "next/link";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import Panel from "@/src/components/admin/ui/Panel";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { resetPasswordAction, setMemberStatusAction } from "@/src/actions/admin/members";
import { USER_STATUS_LABELS, USER_STATUS_TONE, formatDate } from "@/src/components/admin/labels";
import type { FormState } from "@/src/actions/admin/form-state";
import type { MembershipRole } from "@/src/server/db/types";
import type { UserStatus } from "@/src/server/db/types";

interface MemberSidebarProps {
  id: string;
  login: string;
  status: UserStatus;
  role: MembershipRole;
  roleAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  lastEdit: { at: string; fields: string[] } | null;
}

const FIELD_LABELS: Record<string, string> = {
  firstName: "Имя",
  lastName: "Фамилия",
  specializationId: "Направление",
  roleTitle: "Должность",
  stack: "Стек",
  bio: "О себе",
  skills: "Навыки",
  github: "GitHub",
  linkedin: "LinkedIn",
  portfolio: "Портфолио",
};

const RoleForm: FC<{ role: MembershipRole; action: MemberSidebarProps["roleAction"] }> = ({
  role,
  action,
}) => {
  const [state, formAction, pending] = useActionState(action, {});
  const error = pending ? undefined : (state.error ?? state.fieldErrors?.role);
  return (
    <form action={formAction} className={scss.roleForm}>
      <label htmlFor="member-role-select" className={scss.visuallyHidden}>
        Роль
      </label>
      <select
        id="member-role-select"
        name="role"
        defaultValue={role}
        key={JSON.stringify(state)}
        className={scss.inlineSelect}
      >
        <option value="DEVELOPER">Разработчик</option>
        <option value="TEAM_LEAD">Тимлид</option>
      </select>
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

const MemberSidebar: FC<MemberSidebarProps> = ({ id, login, status, role, roleAction, lastEdit }) => {
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const active = status === "ACTIVE";

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
          onConfirm={() => setMemberStatusAction(id, active ? "INACTIVE" : "ACTIVE")}
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

      {lastEdit && (
        <Panel title="Правки админа">
          <p className={scss.field__hint}>
            {formatDate(lastEdit.at)}: {lastEdit.fields.map((field) => FIELD_LABELS[field] ?? field).join(", ")}.
            Участнику отправлено уведомление.
          </p>
        </Panel>
      )}

      {active && (
        <Panel>
          <Link href={`/team/${id}`} target="_blank" className={scss.table__link}>
            Открыть публичный профиль ↗
          </Link>
        </Panel>
      )}
    </div>
  );
};

export default MemberSidebar;
