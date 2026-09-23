"use client";

import { FC, ReactNode, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useSafeMotion } from "@/src/hooks/use-safe-motion";
import { springs, motionTokens } from "@/src/lib/motion-tokens";
import Button from "@/src/ui/Button";
import scss from "./CommunityPreview.module.scss";

const PLACEHOLDER_AVATAR = "/team/placeholder-1.webp";

const ROLES = [
  {
    id: "frontend",
    tab: "Frontend",
    people: [
      {
        avatar: PLACEHOLDER_AVATAR,
        role: "Тимлид Frontend",
        stack: "React · Next.js",
        fact: "Ведёт 6 продовых релизов за квартал",
      },
      {
        avatar: PLACEHOLDER_AVATAR,
        role: "Frontend-разработчик",
        stack: "TypeScript · Tailwind",
        fact: "Собрал дизайн-систему комьюнити",
      },
    ],
  },
  {
    id: "backend",
    tab: "Backend",
    people: [
      {
        avatar: PLACEHOLDER_AVATAR,
        role: "Тимлид Backend",
        stack: "Node.js · PostgreSQL",
        fact: "Строит архитектуру для CRM и LMS-систем",
      },
      {
        avatar: PLACEHOLDER_AVATAR,
        role: "Backend-разработчик",
        stack: "FastAPI · Redis",
        fact: "Ускорил ответ API до 200 мс",
      },
    ],
  },
  {
    id: "ai",
    tab: "AI/ML",
    people: [
      {
        avatar: PLACEHOLDER_AVATAR,
        role: "Тимлид AI/ML",
        stack: "Python · LLM",
        fact: "Внедряет AI-интеграции в продакшн",
      },
      {
        avatar: PLACEHOLDER_AVATAR,
        role: "AI/ML-инженер",
        stack: "PyTorch · CV",
        fact: "Обучает модели компьютерного зрения",
      },
    ],
  },
] as const;

interface FloatingNoteProps {
  posClassName: string;
  innerClassName: string;
  floatDelay: number;
  enterDelay: number;
  children: ReactNode;
}

const FloatingNote: FC<FloatingNoteProps> = ({
  posClassName,
  innerClassName,
  floatDelay,
  enterDelay,
  children,
}) => {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={posClassName}
      initial={{ opacity: 0, y: motionTokens.distance.sm }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: motionTokens.distance.sm }}
      transition={{ ...springs.snappy, delay: enterDelay }}
    >
      <motion.div
        className={innerClassName}
        animate={
          reduce ? undefined : { y: [0, -9, 0, 7, 0], x: [0, 4, 0, -4, 0] }
        }
        transition={
          reduce
            ? undefined
            : {
                duration: 7 + floatDelay,
                repeat: Infinity,
                ease: motionTokens.easing.smooth,
                delay: floatDelay,
              }
        }
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

const CommunityPreview: FC = () => {
  const safeMotion = useSafeMotion(12);
  const [activeRoleId, setActiveRoleId] = useState<
    (typeof ROLES)[number]["id"]
  >(ROLES[0].id);
  const [activePersonIndex, setActivePersonIndex] = useState(0);

  const activeRole =
    ROLES.find((role) => role.id === activeRoleId) ?? ROLES[0];
  const activePerson =
    activeRole.people[activePersonIndex] ?? activeRole.people[0];

  const handleRoleChange = (id: (typeof ROLES)[number]["id"]) => {
    setActiveRoleId(id);
    setActivePersonIndex(0);
  };

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
                onClick={() => handleRoleChange(role.id)}
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
              key={`${activeRole.id}-${activePersonIndex}`}
              className={scss.orbit}
              initial={safeMotion.initial}
              animate={safeMotion.animate}
              exit={safeMotion.exit}
              transition={springs.snappy}
            >
              <div className={scss.orbit__circle}>
                <div className={scss.orbit__circleImgWrap}>
                  <Image
                    src={activePerson.avatar}
                    alt={activePerson.role}
                    fill
                    sizes="340px"
                    className={scss.orbit__circleImg}
                  />
                </div>
              </div>

              <FloatingNote
                posClassName={`${scss.blob} ${scss["blob--role"]}`}
                innerClassName={scss.blob__role}
                floatDelay={0}
                enterDelay={0.05}
              >
                <span className={scss.blob__dot} aria-hidden="true" />
                {activePerson.role}
              </FloatingNote>

              <FloatingNote
                posClassName={`${scss.blob} ${scss["blob--stack"]}`}
                innerClassName={scss.blob__stack}
                floatDelay={0.6}
                enterDelay={0.1}
              >
                {activePerson.stack}
              </FloatingNote>

              <FloatingNote
                posClassName={`${scss.blob} ${scss["blob--fact"]}`}
                innerClassName={scss.blob__fact}
                floatDelay={1.1}
                enterDelay={0.15}
              >
                {activePerson.fact}
              </FloatingNote>

              <FloatingNote
                posClassName={`${scss.blob} ${scss["blob--count"]}`}
                innerClassName={scss.blob__count}
                floatDelay={1.6}
                enterDelay={0.2}
              >
                {String(activePersonIndex + 1).padStart(2, "0")} /{" "}
                {String(activeRole.people.length).padStart(2, "0")}
              </FloatingNote>

              <div className={scss.orbit__mobileCaption}>
                {activePerson.role}
              </div>
            </motion.div>
          </AnimatePresence>

          {activeRole.people.length > 1 && (
            <div className={scss.dots} role="group" aria-label="Участник">
              {activeRole.people.map((person, i) => (
                <button
                  key={person.role}
                  type="button"
                  className={`${scss.dot} ${i === activePersonIndex ? scss["dot--active"] : ""}`}
                  aria-label={`Показать: ${person.role}`}
                  aria-current={i === activePersonIndex}
                  onClick={() => setActivePersonIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CommunityPreview;
