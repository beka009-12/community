"use client";

import { FC, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { springs } from "@/src/lib/motion-tokens";
import Button from "@/src/ui/Button";
import Select from "@/src/ui/Select";
import { SPECIALIZATIONS } from "@/src/data/specializations";
import { SPECIALIZATION_ICONS } from "./specialization-icons";
import { MEMBERS } from "@/src/data/members";
import scss from "./Roster.module.scss";

type FilterKey = "all" | (typeof SPECIALIZATIONS)[number]["id"];

// This will grow to more than one filter, hence a row of selects
// rather than a single pill-tab strip.
const DIRECTION_OPTIONS = [
  { value: "all", label: "Все направления" },
  ...SPECIALIZATIONS.map((spec) => ({
    value: spec.id,
    label: spec.title,
    icon: SPECIALIZATION_ICONS[spec.id],
  })),
];

// Contact-sheet treatment instead of another bordered-card grid: one
// frame, hairline dividers between cells (gap-as-divider, no per-cell
// radius/shadow), photos desaturated until hover/focus reveals color +
// role/stack — a distinct visual moment for the one section on this
// page that's actually about people, not another spotlight-card grid.
const Roster: FC = () => {
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible = useMemo(
    () =>
      filter === "all"
        ? MEMBERS
        : MEMBERS.filter((member) => member.specializationId === filter),
    [filter],
  );

  return (
    <section className={scss.roster}>
      <div className={`container ${scss.roster__inner}`}>
        <h2 className={scss.roster__title}>Участники</h2>

        <div className={scss.filters}>
          <Select
            options={DIRECTION_OPTIONS}
            value={filter}
            onChange={(next) => setFilter(next as FilterKey)}
            ariaLabel="Фильтр по направлению"
          />
        </div>

        <div className={scss.frame}>
          <div className={scss.frame__grid}>
            <AnimatePresence mode="popLayout">
              {visible.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={springs.gentle}
                  className={scss.cell}
                  tabIndex={0}
                >
                  <Image
                    src={member.photo}
                    alt=""
                    fill
                    sizes="(min-width: 960px) 200px, 33vw"
                    className={scss.cell__img}
                  />
                  <span className={scss.cell__index}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={scss.cell__scrim} aria-hidden="true" />
                  <div className={scss.cell__caption}>
                    <span className={scss.cell__role}>{member.role}</span>
                    <span className={scss.cell__stack}>{member.stack}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className={scss.footer}>
          <p className={scss.footer__text}>Нужна команда под ваш проект?</p>
          <div className={scss.footer__actions}>
            <Button href="/about#request" variant="primary">
              Обсудить проект
            </Button>
            <Button href="https://motion.kg" variant="ghost" external>
              Присоединиться к сообществу
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roster;
