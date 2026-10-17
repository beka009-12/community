"use client";

import { FC } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Avatar from "@/src/ui/Avatar";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import { MEMBERSHIP_ROLE_LABELS, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import type { TeamPerson } from "@/src/server/api/joins";
import scss from "./TeamSection.module.scss";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const memberVariants = {
  hidden: { opacity: 0, y: motionTokens.distance.md },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const TeamSection: FC<{ people: TeamPerson[] }> = ({ people }) => {
  const reduce = useReducedMotion();

  return (
    <motion.ul
      className={scss.team}
      variants={reduce ? undefined : containerVariants}
      initial={reduce ? undefined : "hidden"}
      whileInView={reduce ? undefined : "visible"}
      viewport={{ once: true, margin: "-60px" }}
    >
      {people.map(({ member, role }) => {
        const name = fullName(member);
        const caption = [MEMBERSHIP_ROLE_LABELS[role], positionLabel(member.position)]
          .filter(Boolean)
          .join(" · ");
        return (
          <motion.li
            key={member.id}
            className={scss.member}
            variants={reduce ? undefined : memberVariants}
          >
            <Link
              href={`/team/${member.id}`}
              className={scss.member__link}
              aria-label={`${name}, ${caption}`}
            >
              <span className={scss.member__avatar}>
                <Avatar src={member.avatar} name={name} imageClassName={scss.member__avatarImg} />
              </span>

              <span className={scss.member__info}>
                <span className={scss.member__role}>{name}</span>
                <span className={scss.member__stack}>{caption}</span>
              </span>
            </Link>
          </motion.li>
        );
      })}
    </motion.ul>
  );
};

export default TeamSection;
