"use client";

import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import { getMemberName, type Member } from "@/src/data/members";
import scss from "./TeamSection.module.scss";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const memberVariants = {
  hidden: { opacity: 0, y: motionTokens.distance.md },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const TeamSection: FC<{ members: Member[] }> = ({ members }) => {
  const reduce = useReducedMotion();

  return (
    <motion.ul
      className={scss.team}
      variants={reduce ? undefined : containerVariants}
      initial={reduce ? undefined : "hidden"}
      whileInView={reduce ? undefined : "visible"}
      viewport={{ once: true, margin: "-60px" }}
    >
      {members.map((member) => (
        <motion.li
          key={member.id}
          className={scss.member}
          variants={reduce ? undefined : memberVariants}
        >
          <Link
            href={`/team/${member.id}`}
            className={scss.member__link}
            aria-label={`${getMemberName(member)}, ${member.role}`}
          >
            <span className={scss.member__avatar}>
              <Image
                src={member.photo}
                alt=""
                fill
                sizes="48px"
                className={scss.member__avatarImg}
              />
            </span>

            <span className={scss.member__info}>
              <span className={scss.member__role}>{member.role}</span>
              <span className={scss.member__stack}>{member.stack}</span>
            </span>
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  );
};

export default TeamSection;
