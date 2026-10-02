import Button from "@/src/ui/Button";
import DataTable from "@/src/components/admin/ui/DataTable";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import StatusBadge, { type BadgeTone } from "@/src/components/admin/ui/StatusBadge";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_TONE } from "@/src/data/projects";
import { requireAdmin } from "@/src/server/auth/dal";
import { listProjects } from "@/src/server/repositories/projects";
import type { DbProject } from "@/src/server/db/types";

type Row = DbProject & { memberCount: number };

const Page = async () => {
  await requireAdmin();
  const projects = await listProjects();
  return (
    <>
      <PageHeader
        title="Проекты"
        action={
          <Button href="/admin/projects/new" variant="primary">
            Создать проект
          </Button>
        }
      />
      <DataTable<Row>
        rows={projects}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin/projects/${row.id}`}
        empty="Проектов пока нет."
        columns={[
          { key: "name", label: "Название", render: (row) => row.name },
          {
            key: "status",
            label: "Статус",
            render: (row) => (
              <StatusBadge tone={STATUS_TONE[row.status] as BadgeTone}>
                {STATUS_LABELS[row.status]}
              </StatusBadge>
            ),
          },
          { key: "category", label: "Категория", render: (row) => CATEGORY_LABELS[row.category] },
          { key: "count", label: "Участников", render: (row) => row.memberCount },
        ]}
      />
    </>
  );
};

export default Page;
