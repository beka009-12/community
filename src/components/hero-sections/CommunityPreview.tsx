"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useSafeMotion } from "@/src/hooks/use-safe-motion";
import { springs } from "@/src/lib/motion-tokens";
import Button from "@/src/ui/Button";
import scss from "./CommunityPreview.module.scss";

const PLACEHOLDER_AVATAR = "/team/placeholder-1.webp";

const ROLES = [
  {
    id: "frontend",
    tab: "Frontend",
    role: "Тимлид Frontend",
    avatar: PLACEHOLDER_AVATAR,
    stack: "React · Next.js",
    fact: "Ведёт 6 продовых релизов за квартал",
  },
  {
    id: "backend",
    tab: "Backend",
    role: "Тимлид Backend",
    avatar: PLACEHOLDER_AVATAR,
    stack: "Node.js · PostgreSQL",
    fact: "Строит архитектуру для CRM и LMS-систем",
  },
  {
    id: "ai",
    tab: "AI/ML",
    role: "Тимлид AI/ML",
    avatar: PLACEHOLDER_AVATAR,
    stack: "Python · LLM",
    fact: "Внедряет AI-интеграции в продакшн",
  },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

const CommunityPreview: FC = () => {
  const safeMotion = useSafeMotion(12);
  const [activeRoleId, setActiveRoleId] = useState<RoleId>(ROLES[0].id);
  const activeRole = ROLES.find((role) => role.id === activeRoleId) ?? ROLES[0];

  return (
    <section id="community" className={scss.community}>
      <div className={`container ${scss.community__inner}`}>
        <div className={scss.community__intro}>
          <h2>Тимлиды, которые ведут проекты</h2>
          <p>
            За каждым направлением стоит команда с реальным опытом — тимлиды
            принимают архитектурные решения и проверяют код каждого участника.
          </p>

          <div
            className={scss.community__tabs}
            role="group"
            aria-label="Направление"
          >
            {ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                className={scss.tab}
                aria-pressed={activeRoleId === role.id}
                onClick={() => setActiveRoleId(role.id)}
              >
                {activeRoleId === role.id && (
                  <motion.span
                    layoutId="lead-tab-pill"
                    className={scss.tab__pill}
                    transition={springs.snappy}
                  />
                )}
                <span
                  className={`${scss.tab__label} ${activeRoleId === role.id ? scss["tab__label--active"] : ""}`}
                >
                  {role.tab}
                </span>
              </button>
            ))}
          </div>

          <Button href="/team" variant="ghost" className={scss.community__cta}>
            Смотреть команду
          </Button>
        </div>

        <div className={scss.stage}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole.id}
              className={scss.showcase}
              initial={safeMotion.initial}
              animate={safeMotion.animate}
              exit={safeMotion.exit}
              transition={springs.snappy}
            >
              <div className={scss.photoFrame}>
                <div className={scss.photoFrame__imgWrap}>
                  <Image
                    src={activeRole.avatar}
                    alt={activeRole.role}
                    fill
                    sizes="(min-width: 640px) 280px, 240px"
                    className={scss.photoFrame__img}
                  />
                </div>
                <span className={scss.photoFrame__badge}>
                  <span className={scss.photoFrame__dot} aria-hidden="true" />
                  {activeRole.role}
                </span>
              </div>

              <div className={scss.info}>
                <span className={scss.info__stack}>{activeRole.stack}</span>
                <p className={scss.info__fact}>{activeRole.fact}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default CommunityPreview;
