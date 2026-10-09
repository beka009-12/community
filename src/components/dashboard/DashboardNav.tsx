"use client";

import { FC, ReactNode, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { logout } from "@/src/actions/auth";
import { LogoutIcon } from "@/src/components/admin/icons";
import { springs } from "@/src/lib/motion-tokens";
import { initials } from "@/src/lib/people";
import scss from "./DashboardShell.module.scss";

export interface DashboardLink {
  href: string;
  label: string;
  icon: ReactNode;
  count?: number;
  // Accent badge = needs attention; plain number = just a total.
  alert?: boolean;
}

export interface DashboardPerson {
  name: string;
  caption: string;
}

export interface DashboardNavProps {
  brand: string;
  homeHref: string;
  navLabel: string;
  links: DashboardLink[];
  person: DashboardPerson;
}

const DashboardNav: FC<DashboardNavProps> = ({ brand, homeHref, navLabel, links, person }) => {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === homeHref ? pathname === href : pathname.startsWith(href));

  return (
    <aside className={scss.sidebar}>
      <div className={scss.sidebar__top}>
        <Link href={homeHref} className={scss.brand} aria-label={`Motion ${brand} — главная`}>
          <Image src="/brand/motion-logo.svg" alt="" width={40} height={21} />
          <span>{brand}</span>
        </Link>
        <button
          type="button"
          className={scss.toggle}
          aria-expanded={open}
          aria-controls="dashboard-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Закрыть" : "Меню"}
        </button>
      </div>

      <nav id="dashboard-nav" className={`${scss.nav} ${open ? scss["nav--open"] : ""}`} aria-label={navLabel}>
        <ul>
          {links.map((link) => {
            const active = isActive(link.href);
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
                      layoutId="dashboard-nav-pill"
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
            {initials(person.name)}
          </span>
          <span className={scss.account__name}>
            {person.name}
            <small>{person.caption}</small>
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

export default DashboardNav;
