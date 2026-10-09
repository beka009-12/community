import { FC, ReactNode } from "react";
import Panel from "@/src/components/admin/ui/Panel";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import scss from "./Resume.module.scss";

interface ResumeSectionProps {
  title: string;
  isEmpty: boolean;
  add: ReactNode;
  children: ReactNode;
}

export const ResumeSection: FC<ResumeSectionProps> = ({ title, isEmpty, add, children }) => (
  <Panel title={title}>
    {isEmpty ? (
      <p className={ui.empty}>Пока пусто — добавьте первую запись.</p>
    ) : (
      <ul className={scss.list}>{children}</ul>
    )}
    <div className={scss.add}>{add}</div>
  </Panel>
);

interface ResumeCardProps {
  title: string;
  meta: string[];
  text?: string;
  actions: ReactNode;
}

export const ResumeCard: FC<ResumeCardProps> = ({ title, meta, text, actions }) => (
  <li className={scss.card}>
    <div className={scss.card__body}>
      <p className={scss.card__title}>{title}</p>
      {meta.length > 0 && <p className={scss.card__meta}>{meta.join(" · ")}</p>}
      {text && <p className={scss.card__text}>{text}</p>}
    </div>
    <div className={scss.card__actions}>{actions}</div>
  </li>
);
