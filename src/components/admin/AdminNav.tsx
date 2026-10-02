"use client";

import { FC, ReactNode, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { logout } from "@/src/actions/auth";
import { springs } from "@/src/lib/motion-tokens";
import {
  LogoutIcon,
  MembersIcon,
  OverviewIcon,
  ProjectsIcon,
  RequestsIcon,
  SettingsIcon,
  TeamsIcon,
} from "./icons";
import scss from "./AdminShell.module.scss";

export interface NavCounts {
  members: number;
  teams: number;
  projects: number;
  newRequests: number;
}

interface NavLink {
  href: string;
  label: string;
  icon: ReactNode;
  count?: number;
  // Accent badge = needs attention; plain number = just a total.
  alert?: boolean;
}

const isActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === href : pathname.startsWith(href);

const AdminNav: FC<{ counts: NavCounts }> = ({ counts }) => {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  const links: NavLink[] = [
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
    { href: "/admin/settings", label: "Настройки", icon: <SettingsIcon /> },
  ];

  return (
    <aside className={scss.sidebar}>
      <div className={scss.sidebar__top}>
        <Link href="/admin" className={scss.brand} aria-label="Motion admin — обзор">
          <Image src="/brand/motion-logo.svg" alt="" width={40} height={21} />
          <span>admin</span>
        </Link>
        <button
          type="button"
          className={scss.toggle}
          aria-expanded={open}
          aria-controls="admin-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Закрыть" : "Меню"}
        </button>
      </div>

      <nav
        id="admin-nav"
        className={`${scss.nav} ${open ? scss["nav--open"] : ""}`}
        aria-label="Разделы админки"
      >
        <ul>
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${scss.nav__link} ${active ? scss["nav__link--active"] : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-nav-pill"
                      className={scss.nav__pill}
                      transition={reduce ? { duration: 0 } : springs.snappy}
                    />
                  )}
                  <span className={scss.nav__icon}>{link.icon}</span>
                  <span className={scss.nav__label}>{link.label}</span>
                  {link.count !== undefined && (
                    <span
                      className={`${scss.nav__count} ${link.alert ? scss["nav__count--alert"] : ""}`}
                      aria-label={link.alert ? `Новых: ${link.count}` : `Всего: ${link.count}`}
                    >
                      {link.count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={scss.account}>
          <span className={scss.account__avatar} aria-hidden="true">
            A
          </span>
          <span className={scss.account__name}>
            Админ
            <small>Motion Community</small>
          </span>
          <form action={logout}>
            <button type="submit" className={scss.account__logout} aria-label="Выйти">
              <LogoutIcon />
            </button>
          </form>
        </div>
      </nav>
    </aside>
  );
};

export default AdminNav;
