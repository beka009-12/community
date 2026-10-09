import { FC } from "react";
import Link from "next/link";
import { REQUEST_STATUSES, type RequestStatus } from "@/src/lib/api-enums";
import type { ClientRequestListItem } from "@/src/server/api/schemas";
import { formatDate } from "../labels";
import scss from "./RequestBoard.module.scss";

const COLUMN_TITLES: Record<RequestStatus, string> = {
  New: "Новые",
  Reviewing: "На рассмотрении",
};

const RequestCard: FC<{ request: ClientRequestListItem }> = ({ request }) => (
  <li>
    <Link href={`/admin/requests/${request.id}`} className={scss.card}>
      <span className={scss.card__title}>{request.title}</span>
      <span className={scss.card__client}>{request.name}</span>
      <span className={scss.card__meta}>
        <span>{formatDate(request.created_at)}</span>
      </span>
    </Link>
  </li>
);

// Board, not a table: the API knows two stages (New → Reviewing). Status
// changes on the detail page. Stacks into sections on small screens.
const RequestBoard: FC<{ requests: ClientRequestListItem[] }> = ({ requests }) => {
  const byStatus = (status: RequestStatus) =>
    requests.filter((request) => request.status === status);

  return (
    <>
      <nav className={scss.jump} aria-label="Перейти к статусу">
        {REQUEST_STATUSES.map((status) => (
          <a key={status} href={`#status-${status}`}>
            {COLUMN_TITLES[status]} <b>{byStatus(status).length}</b>
          </a>
        ))}
      </nav>

      <div className={scss.board}>
        {REQUEST_STATUSES.map((status) => {
          const items = byStatus(status);
          return (
            <section
              key={status}
              id={`status-${status}`}
              className={`${scss.column} ${scss[`column--${status}`] ?? ""}`}
              aria-labelledby={`col-${status}`}
            >
              <h2 id={`col-${status}`} className={scss.column__title}>
                {COLUMN_TITLES[status]}
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
    </>
  );
};

export default RequestBoard;
