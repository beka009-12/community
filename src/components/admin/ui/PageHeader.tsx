import { FC, ReactNode } from "react";
import Link from "next/link";
import scss from "./admin-ui.module.scss";

interface PageHeaderProps {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  action?: ReactNode;
  // Inline next to the title: a status badge, usually.
  meta?: ReactNode;
}

const PageHeader: FC<PageHeaderProps> = ({ title, description, back, action, meta }) => (
  <header className={scss.pageHeader}>
    <div>
      {back && (
        <Link href={back.href} className={scss.back}>
          ← {back.label}
        </Link>
      )}
      <div className={scss.pageHeader__row}>
        <h1 className={scss.pageHeader__title}>{title}</h1>
        {meta}
      </div>
      {description && <p className={scss.pageHeader__description}>{description}</p>}
    </div>
    {action}
  </header>
);

export default PageHeader;
