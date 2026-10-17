"use client";

import { FC, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { springs } from "@/src/lib/motion-tokens";
import Button from "@/src/ui/Button";
import Select from "@/src/ui/Select";
import Avatar from "@/src/ui/Avatar";
import { POSITIONS, type Position } from "@/src/lib/api-enums";
import { POSITION_LABELS, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import type { MemberListItem } from "@/src/server/api/schemas";
import { SPECIALIZATION_ICONS } from "./specialization-icons";
import scss from "./Roster.module.scss";

type FilterKey = "all" | Position;

// This will grow to more than one filter, hence a row of selects
// rather than a single pill-tab strip.
const DIRECTION_OPTIONS = [
  { value: "all", label: "Все направления" },
  ...POSITIONS.map((position) => ({
    value: position,
    label: POSITION_LABELS[position],
    icon: SPECIALIZATION_ICONS[position],
  })),
];

// Contact-sheet treatment instead of another bordered-card grid: one
// frame, hairline dividers between cells (gap-as-divider, no per-cell
// radius/shadow), photos desaturated until hover/focus reveals color +
// role/stack — a distinct visual moment for the one section on this
// page that's actually about people, not another spotlight-card grid.
const Roster: FC<{ members: MemberListItem[] }> = ({ members }) => {
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible = useMemo(
    () =>
      filter === "all"
        ? members
        : members.filter((member) => member.position === filter),
    [filter, members],
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
              {visible.map((member, index) => {
                const name = fullName(member);
                const position = positionLabel(member.position);
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={springs.gentle}
                    className={scss.cell}
                  >
                    <Link
                      href={`/team/${member.id}`}
                      className={scss.cell__link}
                      aria-label={position ? `${name}, ${position}` : name}
                    >
                      <Avatar src={member.avatar} name={name} imageClassName={scss.cell__img} />
                      <span className={scss.cell__index}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={scss.cell__scrim} aria-hidden="true" />
                      <div className={scss.cell__caption}>
                        <span className={scss.cell__role}>{name}</span>
                        {position && <span className={scss.cell__stack}>{position}</span>}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className={scss.footer}>
          <p className={scss.footer__text}>Нужна команда под ваш проект?</p>
          <div className={scss.footer__actions}>
            <Button href="/contact" variant="primary">
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
