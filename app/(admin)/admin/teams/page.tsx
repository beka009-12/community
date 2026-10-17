import Button from "@/src/ui/Button";
import DataTable from "@/src/components/admin/ui/DataTable";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import PersonCell from "@/src/components/admin/PersonCell";
import { getTeams } from "@/src/server/api/teams";
import type { TeamListItem } from "@/src/server/api/schemas";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  const teams = await getTeams();
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
      <DataTable<TeamListItem>
        rows={teams}
        rowKey={(row) => String(row.id)}
        rowHref={(row) => `/admin/teams/${row.id}`}
        empty="Команд пока нет."
        columns={[
          {
            key: "name",
            label: "Команда",
            render: (row) => <PersonCell avatar={row.team_image} name={row.team_name} />,
          },
        ]}
      />
    </>
  );
};

export default Page;
