"use client";

import { FC } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import type { ProjectTeamMember } from "@/src/data/projects";
import scss from "./TeamSection.module.scss";

// Same stand-in used by the homepage's CommunityPreview section — no
// real member photos exist yet.
const PLACEHOLDER_AVATAR = "/team/placeholder-1.webp";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const memberVariants = {
  hidden: { opacity: 0, y: motionTokens.distance.md },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const TeamSection: FC<{ members: ProjectTeamMember[] }> = ({ members }) => {
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
          key={member.role}
          className={scss.member}
          variants={reduce ? undefined : memberVariants}
        >
          <span className={scss.member__avatar}>
            <Image
              src={PLACEHOLDER_AVATAR}
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
        </motion.li>
      ))}
    </motion.ul>
  );
};

export default TeamSection;
