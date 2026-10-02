import { FC } from "react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/src/data/projects";
import type { DbClientRequest, RequestStatus } from "@/src/server/db/types";
import { formatDate } from "../labels";
import scss from "./RequestBoard.module.scss";

const COLUMNS: { status: RequestStatus; title: string }[] = [
  { status: "NEW", title: "Новые" },
  { status: "REVIEWING", title: "На рассмотрении" },
  { status: "ACCEPTED", title: "Приняты" },
  { status: "IN_PROGRESS", title: "В работе" },
  { status: "COMPLETED", title: "Завершены" },
];

const RequestCard: FC<{ request: DbClientRequest }> = ({ request }) => (
  <li>
    <Link href={`/admin/requests/${request.id}`} className={scss.card}>
      <span className={scss.card__title}>{request.title}</span>
      <span className={scss.card__client}>
        {request.name}
        {request.company && ` · ${request.company}`}
      </span>
      <span className={scss.card__meta}>
        {request.projectType && <span>{CATEGORY_LABELS[request.projectType]}</span>}
        <span>{formatDate(request.createdAt)}</span>
      </span>
    </Link>
  </li>
);

// Board, not a table: a request's whole life is moving through these
// columns. Status changes on the detail page; the board shows where
// everything stands at a glance. Stacks into sections on small screens.
const RequestBoard: FC<{ requests: DbClientRequest[] }> = ({ requests }) => {
  const byStatus = (status: RequestStatus) =>
    requests.filter((request) => request.status === status);
  const rejected = byStatus("REJECTED");

  return (
    <>
      <nav className={scss.jump} aria-label="Перейти к статусу">
        {COLUMNS.map((column) => (
          <a key={column.status} href={`#status-${column.status}`}>
            {column.title} <b>{byStatus(column.status).length}</b>
          </a>
        ))}
      </nav>

      <div className={scss.board}>
        {COLUMNS.map((column) => {
          const items = byStatus(column.status);
          return (
            <section
              key={column.status}
              id={`status-${column.status}`}
              className={`${scss.column} ${scss[`column--${column.status}`] ?? ""}`}
              aria-labelledby={`col-${column.status}`}
            >
              <h2 id={`col-${column.status}`} className={scss.column__title}>
                {column.title}
                <span className={scss.column__count}>{items.length}</span>
              </h2>
              {items.length === 0 ? (
                <p className={scss.column__empty}>Пусто</p>
              ) : (
                <ul className={scss.column__list}>
                  {items.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <details className={scss.rejected} id="status-REJECTED">
        <summary>
          Отклонённые <span className={scss.column__count}>{rejected.length}</span>
        </summary>
        {rejected.length === 0 ? (
          <p className={scss.column__empty}>Отклонённых заявок нет.</p>
        ) : (
          <ul className={scss.rejected__list}>
            {rejected.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </ul>
        )}
      </details>
    </>
  );
};

export default RequestBoard;
