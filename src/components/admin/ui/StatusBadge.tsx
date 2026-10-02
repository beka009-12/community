import { FC, ReactNode } from "react";
import scss from "./admin-ui.module.scss";

export type BadgeTone = "positive" | "accent" | "neutral" | "muted" | "danger";

const StatusBadge: FC<{ tone: BadgeTone; children: ReactNode }> = ({ tone, children }) => (
  <span className={`${scss.badge} ${scss[`badge--${tone}`]}`}>{children}</span>
);

export default StatusBadge;
