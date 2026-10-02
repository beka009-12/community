"use client";

import { FC } from "react";
import { motion, useReducedMotion } from "motion/react";
import { springs } from "@/src/lib/motion-tokens";
import { TESTIMONIALS } from "@/src/data/testimonials";
import scss from "./Testimonials.module.scss";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const Testimonials: FC = () => {
  const reduce = useReducedMotion();

  return (
    <section className={scss.testimonials}>
      <div className={`container ${scss.testimonials__inner}`}>
        <span className={scss.testimonials__eyebrow}>
          <span className={scss.testimonials__index}>§ 05</span>
          Отзывы клиентов
        </span>
        <h2 className={scss.testimonials__title}>Что говорят клиенты</h2>

        <motion.div
          className={scss.grid}
          variants={reduce ? undefined : containerVariants}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "visible"}
          viewport={{ once: true, margin: "-60px" }}
        >
          {TESTIMONIALS.map((item, index) => (
            <motion.figure
              key={index}
              className={scss.card}
              variants={reduce ? undefined : itemVariants}
            >
              <span className={scss.card__mark} aria-hidden="true">
                “
              </span>
              <blockquote className={scss.card__quote}>{item.quote}</blockquote>
              <figcaption className={scss.card__author}>
                <span className={scss.card__name}>{item.author}</span>
                <span className={scss.card__company}>{item.company}</span>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
