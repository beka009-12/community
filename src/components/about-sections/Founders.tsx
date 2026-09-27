"use client";

import { FC } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import { FOUNDERS, FOUNDER_AVATAR } from "@/src/data/founders";
import scss from "./Founders.module.scss";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: motionTokens.distance.md },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const Founders: FC = () => {
  const reduce = useReducedMotion();

  return (
    <section className={scss.founders}>
      <div className={`container ${scss.founders__inner}`}>
        <span className={scss.founders__eyebrow}>Команда</span>
        <h2 className={scss.founders__title}>Основатели</h2>

        <motion.ul
          className={scss.founders__grid}
          variants={reduce ? undefined : containerVariants}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "visible"}
          viewport={{ once: true, margin: "-60px" }}
        >
          {FOUNDERS.map((founder) => (
            <motion.li
              key={founder.id}
              className={scss.founder}
              variants={reduce ? undefined : itemVariants}
            >
              <span className={scss.founder__avatar}>
                <Image
                  src={FOUNDER_AVATAR}
                  alt=""
                  fill
                  sizes="72px"
                  className={scss.founder__avatarImg}
                />
              </span>
              <span className={scss.founder__name}>{founder.name}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
};

export default Founders;
