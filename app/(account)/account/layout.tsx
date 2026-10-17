import type { ReactNode } from "react";
import DashboardShell from "@/src/components/dashboard/DashboardShell";
import type { DashboardLink } from "@/src/components/dashboard/DashboardNav";
import { ArrowRightIcon, OverviewIcon, ProjectsIcon, RequestsIcon, TeamsIcon } from "@/src/components/admin/icons";
import { USER_ROLE_LABELS, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { getMyProfile } from "@/src/server/api/account";
import { requireRole } from "@/src/server/auth/dal";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireRole();
  const me = await getMyProfile();
  const links: DashboardLink[] = [
    { href: "/account", label: "Профиль", icon: <OverviewIcon /> },
    { href: "/account/resume", label: "Резюме", icon: <RequestsIcon /> },
    { href: "/account/projects", label: "Мои проекты", icon: <ProjectsIcon /> },
    { href: "/account/teams", label: "Мои команды", icon: <TeamsIcon /> },
  ];
  if (me.role === "Admin") links.push({ href: "/admin", label: "Админка", icon: <ArrowRightIcon /> });

  return (
    <DashboardShell
      brand="кабинет"
      homeHref="/account"
      navLabel="Разделы кабинета"
      links={links}
      person={{ name: fullName(me, me.login), caption: positionLabel(me.position) ?? USER_ROLE_LABELS[me.role] }}
    >
      {children}
    </DashboardShell>
  );
}
