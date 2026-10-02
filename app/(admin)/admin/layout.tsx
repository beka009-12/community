import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/src/components/admin/AdminShell";
import { requireAdmin } from "@/src/server/auth/dal";
import { listClientRequests } from "@/src/server/repositories/requests";

export const metadata: Metadata = {
  title: "Админка — Motion Community",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const newRequests = (await listClientRequests("NEW")).length;
  return <AdminShell newRequests={newRequests}>{children}</AdminShell>;
}
