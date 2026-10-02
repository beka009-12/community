"use client";

import { FC, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/src/actions/auth";
import scss from "./AdminShell.module.scss";

const LINKS = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/members", label: "Участники" },
  { href: "/admin/teams", label: "Команды" },
  { href: "/admin/projects", label: "Проекты" },
  { href: "/admin/requests", label: "Заявки" },
  { href: "/admin/settings", label: "Настройки" },
];

const isActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === href : pathname.startsWith(href);

const AdminNav: FC<{ newRequests: number }> = ({ newRequests }) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside className={scss.sidebar}>
      <div className={scss.sidebar__top}>
        <Link href="/admin" className={scss.brand}>
          Motion <span>admin</span>
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
          {LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${scss.nav__link} ${active ? scss["nav__link--active"] : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                  {link.href === "/admin/requests" && newRequests > 0 && (
                    <span className={scss.badge} aria-label={`Новых: ${newRequests}`}>
                      {newRequests}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <form action={logout} className={scss.logout}>
          <button type="submit">Выйти</button>
        </form>
      </nav>
    </aside>
  );
};

export default AdminNav;
