import { FC, ReactNode } from "react";
import AdminNav, { type NavCounts } from "./AdminNav";
import scss from "./AdminShell.module.scss";

const AdminShell: FC<{ counts: NavCounts; children: ReactNode }> = ({ counts, children }) => (
  <div className={scss.shell}>
    <AdminNav counts={counts} />
    <main className={scss.content}>{children}</main>
  </div>
);

export default AdminShell;
