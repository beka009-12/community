import Select from "@/src/ui/Select";
import Link from "next/link";
import Button from "@/src/ui/Button";
import DataTable from "@/src/components/admin/ui/DataTable";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import PersonCell from "@/src/components/admin/PersonCell";
import {
  ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_TONE,
} from "@/src/components/admin/labels";
import { SPECIALIZATIONS } from "@/src/data/specializations";
import { requireAdmin } from "@/src/server/auth/dal";
import { listMembers, type AdminMember } from "@/src/server/repositories/members";
import { countProjectsByMember } from "@/src/server/repositories/projects";

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

const Page = async ({ searchParams }: PageProps<"/admin/members">) => {
  await requireAdmin();
  const params = await searchParams;
  const q = one(params.q).trim().toLowerCase();
  const role = one(params.role);
  const status = one(params.status);

  const projectCounts = await countProjectsByMember();
  const members = (await listMembers()).filter(({ user, profile }) => {
    const haystack = `${profile.firstName} ${profile.lastName} ${user.login}`.toLowerCase();
    return (
      (!q || haystack.includes(q)) &&
      (!role || user.role === role) &&
      (!status || user.status === status)
    );
  });

  return (
    <>
      <PageHeader
        title="Участники"
        description="Аккаунты создаёт только админ: логин и пароль передаются участнику."
        action={
          <Button href="/admin/members/new" variant="primary">
            Добавить участника
          </Button>
        }
      />

      <form className={scss.filters} method="get">
        <div className={scss.field}>
          <label htmlFor="filter-q">Поиск</label>
          <input id="filter-q" name="q" defaultValue={q} placeholder="Имя или логин" />
        </div>
        <div className={scss.field}>
          <label htmlFor="filter-role">Роль</label>
          <Select
            id="filter-role"
            name="role"
            defaultValue={role}
            block
            options={[
              { value: "", label: "Все роли" },
              { value: "TEAM_LEAD", label: "Тимлид" },
              { value: "DEVELOPER", label: "Разработчик" },
            ]}
          />
        </div>
        <div className={scss.field}>
          <label htmlFor="filter-status">Статус</label>
          <Select
            id="filter-status"
            name="status"
            defaultValue={status}
            block
            options={[
              { value: "", label: "Все статусы" },
              { value: "ACTIVE", label: "Активен" },
              { value: "INACTIVE", label: "Неактивен" },
            ]}
          />
        </div>
        <button type="submit" className={scss.smallButton}>
          Применить
        </button>
        {(q || role || status) && (
          <Link href="/admin/members" className={scss.smallButton}>
            Сбросить
          </Link>
        )}
      </form>

      <DataTable<AdminMember>
        rows={members}
        rowKey={(row) => row.user.id}
        rowHref={(row) => `/admin/members/${row.user.id}`}
        empty="Никого не нашли — измените фильтры."
        rowClassName={(row) => (row.user.status === "INACTIVE" ? scss.row__muted : undefined)}
        columns={[
          {
            key: "name",
            label: "Участник",
            render: ({ profile, user }) => (
              <PersonCell
                photo={profile.photo}
                name={`${profile.firstName} ${profile.lastName}`}
                caption={user.login}
              />
            ),
          },
          { key: "role", label: "Роль", render: ({ user }) => ROLE_LABELS[user.role] },
          {
            key: "spec",
            label: "Направление",
            render: ({ profile }) =>
              SPECIALIZATIONS.find((spec) => spec.id === profile.specializationId)?.title ?? "—",
          },
          {
            key: "projects",
            label: "Проектов",
            render: ({ user }) => projectCounts[user.id] ?? 0,
          },
          {
            key: "status",
            label: "Статус",
            render: ({ user }) => (
              <StatusBadge tone={USER_STATUS_TONE[user.status]}>
                {USER_STATUS_LABELS[user.status]}
              </StatusBadge>
            ),
          },
        ]}
      />
    </>
  );
};

export default Page;
