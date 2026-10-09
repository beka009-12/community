import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/src/components/admin/AdminShell";
import { fullName } from "@/src/lib/people";
import { getMyAccount } from "@/src/server/api/account";
import { getClientRequests } from "@/src/server/api/client-requests";
import { getMembers } from "@/src/server/api/members";
import { getProjects } from "@/src/server/api/projects";
import { getTeams } from "@/src/server/api/teams";
import { requireAdmin } from "@/src/server/auth/dal";

export const metadata: Metadata = {
  title: "Админка — Motion Community",
  robots: { index: false, follow: false },
};

// Members are counted from /members/, not /admin/members/: a blocked admin
// endpoint must not take the whole admin down.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const [members, teams, projects, requests, me] = await Promise.all([
    getMembers(true),
    getTeams(),
    getProjects(true),
    getClientRequests(),
    getMyAccount(),
  ]);
  const counts = {
    members: members.filter((member) => member.status === "Active").length,
    teams: teams.length,
    projects: projects.length,
    newRequests: requests.filter((request) => request.status === "New").length,
  };
  return (
    <AdminShell counts={counts} person={{ name: fullName(me, me.login), caption: "Администратор" }}>
      {children}
    </AdminShell>
  );
}
