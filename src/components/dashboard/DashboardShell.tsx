import { FC, ReactNode } from "react";
import DashboardNav, { type DashboardNavProps } from "./DashboardNav";
import scss from "./DashboardShell.module.scss";

// Sidebar + content frame shared by the admin and the member cabinet.
const DashboardShell: FC<DashboardNavProps & { children: ReactNode }> = ({ children, ...nav }) => (
  <div className={scss.shell}>
    <DashboardNav {...nav} />
    <main className={scss.content}>{children}</main>
  </div>
);

export default DashboardShell;
