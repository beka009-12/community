"use client";

import { FC, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Button from "@/src/ui/Button";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import scss from "./Header.module.scss";

const NAV_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/projects", label: "Проекты" },
  { href: "/about", label: "О нас" },
  { href: "/team", label: "Команда" },
  { href: "/contact", label: "Контакты" },
];

const LANGS = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
] as const;

type LangCode = (typeof LANGS)[number]["code"];

interface PillRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Header: FC = () => {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState<LangCode>("ru");
  const navRef = useRef<HTMLElement>(null);
  const [navPillRect, setNavPillRect] = useState<PillRect | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const [langPillRect, setLangPillRect] = useState<PillRect | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Measure the active link's own box instead of using a shared layoutId:
  // Motion's layoutId FLIP animation reads window scroll to compensate for
  // sticky/fixed ancestors, and that math breaks across a route change
  // (different scroll position, different page height), making the pill
  // fly in from a bogus spot. Plain x/y/width/height values sidestep that
  // projection system entirely.
  useEffect(() => {
    const measure = () => {
      const container = navRef.current;
      const activeLink = container?.querySelector<HTMLElement>(
        '[aria-current="page"]',
      );
      if (!container || !activeLink) {
        setNavPillRect(null);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      setNavPillRect({
        x: linkRect.left - containerRect.left,
        y: linkRect.top - containerRect.top,
        width: linkRect.width,
        height: linkRect.height,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pathname]);

  // Same fix as above: the language pill also sits inside the sticky
  // header, so it inherited the same bug — it would fly in from a bogus
  // spot whenever the header reflowed (e.g. the `scrolled` padding change
  // during a route navigation), even without the language itself changing.
  useEffect(() => {
    const measure = () => {
      const container = langRef.current;
      const activeOption = container?.querySelector<HTMLElement>(
        `.${scss["langOption--active"]}`,
      );
      if (!container || !activeOption) {
        setLangPillRect(null);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const optionRect = activeOption.getBoundingClientRect();
      setLangPillRect({
        x: optionRect.left - containerRect.left,
        y: optionRect.top - containerRect.top,
        width: optionRect.width,
        height: optionRect.height,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [lang, scrolled]);

  const pillTransition = reduce ? { duration: 0 } : springs.snappy;

  return (
    <header
      className={`${scss.header} ${scrolled ? scss["header--scrolled"] : ""}`}
    >
      <div className={`container ${scss.header__inner}`}>
        <Link
          href="/"
          className={`${scss.island} ${scss.island__logo}`}
          aria-label="Motion Community — на главную"
        >
          <Image
            src="/brand/motion-logo.svg"
            alt="Motion Community"
            width={253}
            height={134}
            className={scss.logoImage}
            priority
          />
        </Link>

        <nav
          ref={navRef}
          className={`${scss.island} ${scss.island__nav}`}
          aria-label="Основная навигация"
        >
          {navPillRect && (
            <motion.span
              className={scss.navLink__pill}
              initial={false}
              animate={{
                x: navPillRect.x,
                y: navPillRect.y,
                width: navPillRect.width,
                height: navPillRect.height,
              }}
              transition={pillTransition}
            />
          )}
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${scss.navLink} ${active ? scss["navLink--active"] : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className={scss.navLink__label}>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={scss.header__actions}>
          <div
            ref={langRef}
            className={`${scss.island} ${scss.island__lang}`}
            role="group"
            aria-label="Язык"
          >
            {langPillRect && (
              <motion.span
                className={scss.langOption__pill}
                initial={false}
                animate={{
                  x: langPillRect.x,
                  y: langPillRect.y,
                  width: langPillRect.width,
                  height: langPillRect.height,
                }}
                transition={pillTransition}
              />
            )}
            {LANGS.map((item) => (
              <button
                key={item.code}
                type="button"
                className={`${scss.langOption} ${lang === item.code ? scss["langOption--active"] : ""}`}
                onClick={() => setLang(item.code)}
              >
                <span className={scss.langOption__label}>{item.label}</span>
              </button>
            ))}
          </div>

          <div className={`${scss.island} ${scss.island__auth}`}>
            <Button variant="ghost">Войти</Button>
            <Button variant="primary">Регистрация</Button>
          </div>

          <button
            type="button"
            className={`${scss.island} ${scss.header__burger}`}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={menuOpen ? scss["burgerLine--open1"] : ""} />
            <span className={menuOpen ? scss["burgerLine--open2"] : ""} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            className={scss.mobileMenuWrap}
            initial={{ opacity: 0, y: -motionTokens.distance.md }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -motionTokens.distance.md }}
            transition={{
              duration: reduce
                ? motionTokens.duration.instant
                : motionTokens.duration.normal,
              ease: motionTokens.easing.smooth,
            }}
          >
            <nav className={scss.mobileMenu} aria-label="Мобильная навигация">
              {NAV_LINKS.map((link, index) => {
                const active = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{
                      opacity: 0,
                      x: reduce ? 0 : -motionTokens.distance.sm,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      ...springs.gentle,
                      delay: reduce ? 0 : index * 0.05,
                    }}
                  >
                    <Link
                      href={link.href}
                      className={`${scss.mobileMenu__link} ${active ? scss["mobileMenu__link--active"] : ""}`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              <div className={scss.mobileMenu__footer}>
                <div
                  className={scss.mobileMenu__lang}
                  role="group"
                  aria-label="Язык"
                >
                  {LANGS.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      className={
                        lang === item.code ? scss["langOption--active"] : ""
                      }
                      onClick={() => setLang(item.code)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className={scss.mobileMenu__auth}>
                  <Button variant="ghost">Войти</Button>
                  <Button variant="primary">Регистрация</Button>
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
