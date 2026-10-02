import Link from "next/link";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import DataTable from "@/src/components/admin/ui/DataTable";
import Panel from "@/src/components/admin/ui/Panel";
import { formatDate } from "@/src/components/admin/labels";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { requireAdmin } from "@/src/server/auth/dal";
import { listMembers } from "@/src/server/repositories/members";
import { listProjects } from "@/src/server/repositories/projects";
import { listClientRequests } from "@/src/server/repositories/requests";
import { listTeams } from "@/src/server/repositories/teams";
import type { DbClientRequest } from "@/src/server/db/types";

const Page = async () => {
  await requireAdmin();
  const [members, teams, projects, newRequests] = await Promise.all([
    listMembers(),
    listTeams(),
    listProjects(),
    listClientRequests("NEW"),
  ]);
  const active = members.filter((member) => member.user.status === "ACTIVE").length;

  const stats = [
    { label: "Активных участников", value: active, href: "/admin/members?status=ACTIVE" },
    { label: "Неактивных", value: members.length - active, href: "/admin/members?status=INACTIVE" },
    { label: "Команд", value: teams.length, href: "/admin/teams" },
    {
      label: "Проектов в работе",
      value: projects.filter((project) => project.status === "IN_PROGRESS").length,
      href: "/admin/projects",
    },
    { label: "Новых заявок", value: newRequests.length, href: "/admin/requests?status=NEW" },
  ];

  return (
    <>
      <PageHeader title="Обзор" />

      <div className={scss.stats}>
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className={scss.stat}>
            <div className={scss.stat__value}>{stat.value}</div>
            <div className={scss.stat__label}>{stat.label}</div>
          </Link>
        ))}
      </div>

      <Panel title="Новые заявки">
        <DataTable<DbClientRequest>
          rows={newRequests.slice(0, 5)}
          rowKey={(row) => row.id}
          rowHref={(row) => `/admin/requests/${row.id}`}
          empty="Новых заявок нет."
          columns={[
            { key: "title", label: "Проект", render: (row) => row.title },
            { key: "name", label: "Клиент", render: (row) => row.name },
            { key: "date", label: "Дата", render: (row) => formatDate(row.createdAt) },
          ]}
        />
      </Panel>
    </>
  );
};

export default Page;
