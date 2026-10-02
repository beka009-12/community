import { FC, ReactNode } from "react";
import AdminNav from "./AdminNav";
import scss from "./AdminShell.module.scss";

const AdminShell: FC<{ newRequests: number; children: ReactNode }> = ({
  newRequests,
  children,
}) => (
  <div className={scss.shell}>
    <AdminNav newRequests={newRequests} />
    <main className={scss.content}>{children}</main>
  </div>
);

export default AdminShell;
