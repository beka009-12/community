import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import StatusForm from "@/src/components/admin/requests/StatusForm";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import { formatDate } from "@/src/components/admin/labels";
import { setRequestStatusAction } from "@/src/actions/admin/requests";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_TONE } from "@/src/lib/api-labels";
import { parseId } from "@/src/lib/route-id";
import { getClientRequest } from "@/src/server/api/client-requests";
import { requireAdmin } from "@/src/server/auth/dal";

const formatBudget = (budget: number | null) =>
  budget === null ? "Не указан" : `${budget.toLocaleString("ru-RU")} сом`;

const Page = async ({ params }: PageProps<"/admin/requests/[id]">) => {
  await requireAdmin();
  const id = parseId((await params).id);
  const request = id === null ? null : await getClientRequest(id);
  if (!request) notFound();

  const contact = [
    { label: "Имя", value: request.name },
    { label: "Компания", value: request.company },
    { label: "Email", value: <a href={`mailto:${request.email}`}>{request.email}</a> },
    { label: "Телефон", value: request.phone && <a href={`tel:${request.phone}`}>{request.phone}</a> },
  ];

  return (
    <>
      <PageHeader
        title={request.title}
        description={`Заявка от ${formatDate(request.created_at)}`}
        back={{ href: "/admin/requests", label: "Заявки" }}
        meta={
          <StatusBadge tone={REQUEST_STATUS_TONE[request.status]}>
            {REQUEST_STATUS_LABELS[request.status]}
          </StatusBadge>
        }
      />
      <div className={scss.split}>
        <Panel title="Описание">
          <dl className={scss.meta}>
            <div>
              <dt>Тип проекта</dt>
              <dd>{request.project_type || "Не указан"}</dd>
            </div>
            <div>
              <dt>Бюджет</dt>
              <dd>{formatBudget(request.budget)}</dd>
            </div>
            <div>
              <dt>Что нужно сделать</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{request.description}</dd>
            </div>
          </dl>
        </Panel>
        <div>
          <Panel title="Статус">
            <StatusForm action={setRequestStatusAction.bind(null, request.id)} status={request.status} />
          </Panel>
          <Panel title="Клиент">
            <dl className={scss.meta}>
              {contact.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value || "—"}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
};

export default Page;
