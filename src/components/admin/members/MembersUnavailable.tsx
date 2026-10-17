import { FC } from "react";
import EmptyState from "@/src/components/admin/ui/EmptyState";

// /admin/members/ answers with a redirect to the Django admin login today
// (docs/backend-issues.md #1); the section waits for that fix.
const MembersUnavailable: FC = () => (
  <EmptyState title="Раздел недоступен">
    <p>
      Бэкенд перенаправляет /admin/members/ на вход в Django-админку — нужна
      правка на стороне бэкенда.
    </p>
  </EmptyState>
);

export default MembersUnavailable;
