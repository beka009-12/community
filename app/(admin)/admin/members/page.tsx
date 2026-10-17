import Select from "@/src/ui/Select";
import Link from "next/link";
import Button from "@/src/ui/Button";
import DataTable from "@/src/components/admin/ui/DataTable";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import PersonCell from "@/src/components/admin/PersonCell";
import MembersUnavailable from "@/src/components/admin/members/MembersUnavailable";
import { USER_ROLES, USER_STATUSES } from "@/src/lib/api-enums";
import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_TONE,
  positionLabel,
} from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { getAdminMembers, loadMembersSection } from "@/src/server/api/admin-members";
import { getMembers } from "@/src/server/api/members";
import { getProjectsWithMembers } from "@/src/server/api/projects";
import type { AdminMemberListItem, MemberListItem } from "@/src/server/api/schemas";
import { requireAdmin } from "@/src/server/auth/dal";

interface Row {
  account: AdminMemberListItem;
  profile: MemberListItem | null;
  projects: number;
}

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

const Page = async ({ searchParams }: PageProps<"/admin/members">) => {
  await requireAdmin();
  const params = await searchParams;
  const q = one(params.q).trim().toLowerCase();
  const role = one(params.role);
  const status = one(params.status);

  const header = (
    <PageHeader
      title="Участники"
      description="Аккаунты создаёт только админ: логин и пароль передаются участнику."
      action={
        <Button href="/admin/members/new" variant="primary">
          Добавить участника
        </Button>
      }
    />
  );

  const [section, roster, projects] = await Promise.all([
    loadMembersSection(getAdminMembers()),
    getMembers(true),
    getProjectsWithMembers(true),
  ]);
  if (section.blocked) {
    return (
      <>
        {header}
        <MembersUnavailable />
      </>
    );
  }

  const profiles = new Map(roster.map((member) => [member.id, member]));
  const projectCounts = new Map<number, number>();
  for (const project of projects) {
    for (const row of project.members) {
      projectCounts.set(row.user, (projectCounts.get(row.user) ?? 0) + 1);
    }
  }

  const rows: Row[] = section.data
    .map((account) => ({
      account,
      profile: profiles.get(account.id) ?? null,
      projects: projectCounts.get(account.id) ?? 0,
    }))
    .filter(({ account, profile }) => {
      const haystack = `${profile ? fullName(profile, "") : ""} ${account.login}`.toLowerCase();
      return (
        (!q || haystack.includes(q)) &&
        (!role || account.role === role) &&
        (!status || account.status === status)
      );
    });

  return (
    <>
      {header}

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
              ...USER_ROLES.map((value) => ({ value, label: USER_ROLE_LABELS[value] })),
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
              ...USER_STATUSES.map((value) => ({ value, label: USER_STATUS_LABELS[value] })),
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

      <DataTable<Row>
        rows={rows}
        rowKey={(row) => String(row.account.id)}
        rowHref={(row) => `/admin/members/${row.account.id}`}
        empty="Никого не нашли — измените фильтры."
        rowClassName={(row) => (row.account.status === "Inactive" ? scss.row__muted : undefined)}
        columns={[
          {
            key: "name",
            label: "Участник",
            render: ({ account, profile }) => (
              <PersonCell
                avatar={profile?.avatar ?? null}
                name={profile ? fullName(profile, account.login) : account.login}
                caption={account.login}
              />
            ),
          },
          { key: "role", label: "Роль", render: ({ account }) => USER_ROLE_LABELS[account.role] },
          {
            key: "position",
            label: "Направление",
            render: ({ profile }) => positionLabel(profile?.position ?? null) ?? "—",
          },
          { key: "projects", label: "Проектов", render: (row) => row.projects },
          {
            key: "status",
            label: "Статус",
            render: ({ account }) => (
              <StatusBadge tone={USER_STATUS_TONE[account.status]}>
                {USER_STATUS_LABELS[account.status]}
              </StatusBadge>
            ),
          },
        ]}
      />
    </>
  );
};

export default Page;
