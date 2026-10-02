import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/src/components/admin/AdminShell";
import { requireAdmin } from "@/src/server/auth/dal";
import { listMembers } from "@/src/server/repositories/members";
import { listProjects } from "@/src/server/repositories/projects";
import { listClientRequests } from "@/src/server/repositories/requests";
import { listTeams } from "@/src/server/repositories/teams";

export const metadata: Metadata = {
  title: "Админка — Motion Community",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const [members, teams, projects, newRequests] = await Promise.all([
    listMembers(),
    listTeams(),
    listProjects(),
    listClientRequests("NEW"),
  ]);
  const counts = {
    members: members.filter((member) => member.user.status === "ACTIVE").length,
    teams: teams.length,
    projects: projects.length,
    newRequests: newRequests.length,
  };
  return <AdminShell counts={counts}>{children}</AdminShell>;
}
