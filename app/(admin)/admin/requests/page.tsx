import Link from "next/link";
import DataTable from "@/src/components/admin/ui/DataTable";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONE,
  formatDate,
} from "@/src/components/admin/labels";
import { CATEGORY_LABELS } from "@/src/data/projects";
import { requireAdmin } from "@/src/server/auth/dal";
import { listClientRequests } from "@/src/server/repositories/requests";
import { REQUEST_STATUSES } from "@/src/server/validation/request-status";
import type { DbClientRequest, RequestStatus } from "@/src/server/db/types";

const isStatus = (value: string): value is RequestStatus =>
  (REQUEST_STATUSES as readonly string[]).includes(value);

const Page = async ({ searchParams }: PageProps<"/admin/requests">) => {
  await requireAdmin();
  const raw = (await searchParams).status;
  const status = typeof raw === "string" && isStatus(raw) ? raw : undefined;
  const requests = await listClientRequests(status);

  return (
    <>
      <PageHeader title="Заявки" description="Заявки клиентов с формы на странице «Контакты»." />

      <nav className={scss.filters} aria-label="Фильтр по статусу">
        <Link
          href="/admin/requests"
          className={`${scss.smallButton} ${!status ? scss["smallButton--solid"] : ""}`}
          aria-current={!status ? "page" : undefined}
        >
          Все
        </Link>
        {REQUEST_STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/requests?status=${value}`}
            className={`${scss.smallButton} ${status === value ? scss["smallButton--solid"] : ""}`}
            aria-current={status === value ? "page" : undefined}
          >
            {REQUEST_STATUS_LABELS[value]}
          </Link>
        ))}
      </nav>

      <DataTable<DbClientRequest>
        rows={requests}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin/requests/${row.id}`}
        empty={status ? "Заявок с таким статусом нет." : "Заявок пока нет."}
        columns={[
          { key: "title", label: "Проект", render: (row) => row.title },
          { key: "client", label: "Клиент", render: (row) => row.name },
          { key: "company", label: "Компания", render: (row) => row.company ?? "—" },
          {
            key: "type",
            label: "Тип",
            render: (row) => (row.projectType ? CATEGORY_LABELS[row.projectType] : "—"),
          },
          { key: "date", label: "Дата", render: (row) => formatDate(row.createdAt) },
          {
            key: "status",
            label: "Статус",
            render: (row) => (
              <StatusBadge tone={REQUEST_STATUS_TONE[row.status]}>
                {REQUEST_STATUS_LABELS[row.status]}
              </StatusBadge>
            ),
          },
        ]}
      />
    </>
  );
};

export default Page;
