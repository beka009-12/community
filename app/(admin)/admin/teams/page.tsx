import Button from "@/src/ui/Button";
import DataTable from "@/src/components/admin/ui/DataTable";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import { formatDate } from "@/src/components/admin/labels";
import { requireAdmin } from "@/src/server/auth/dal";
import { listTeams } from "@/src/server/repositories/teams";
import type { DbTeam } from "@/src/server/db/types";

type Row = DbTeam & { memberCount: number };

const Page = async () => {
  await requireAdmin();
  const teams = await listTeams();
  return (
    <>
      <PageHeader
        title="Команды"
        description="Внутренние команды сообщества. На сайте «Команды по проектам» собираются из участников проектов — их состав меняется в разделе «Проекты»."
        action={
          <Button href="/admin/teams/new" variant="primary">
            Создать команду
          </Button>
        }
      />
      <DataTable<Row>
        rows={teams}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin/teams/${row.id}`}
        empty="Команд пока нет."
        columns={[
          { key: "name", label: "Название", render: (row) => row.name },
          { key: "count", label: "Участников", render: (row) => row.memberCount },
          { key: "created", label: "Создана", render: (row) => formatDate(row.createdAt) },
        ]}
      />
    </>
  );
};

export default Page;
