import { FC, ReactNode } from "react";
import DashboardShell from "@/src/components/dashboard/DashboardShell";
import type { DashboardPerson } from "@/src/components/dashboard/DashboardNav";
import { MembersIcon, OverviewIcon, ProjectsIcon, RequestsIcon, TeamsIcon } from "./icons";

export interface NavCounts {
  members: number;
  teams: number;
  projects: number;
  newRequests: number;
}

interface AdminShellProps {
  counts: NavCounts;
  person: DashboardPerson;
  children: ReactNode;
}

const AdminShell: FC<AdminShellProps> = ({ counts, person, children }) => (
  <DashboardShell
    brand="admin"
    homeHref="/admin"
    navLabel="Разделы админки"
    person={person}
    links={[
      { href: "/admin", label: "Обзор", icon: <OverviewIcon /> },
      { href: "/admin/members", label: "Участники", icon: <MembersIcon />, count: counts.members },
      { href: "/admin/teams", label: "Команды", icon: <TeamsIcon />, count: counts.teams },
      { href: "/admin/projects", label: "Проекты", icon: <ProjectsIcon />, count: counts.projects },
      {
        href: "/admin/requests",
        label: "Заявки",
        icon: <RequestsIcon />,
        count: counts.newRequests || undefined,
        alert: true,
      },
    ]}
  >
    {children}
  </DashboardShell>
);

export default AdminShell;
