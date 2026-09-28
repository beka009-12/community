"use client";

import { FC, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { springs } from "@/src/lib/motion-tokens";
import { MILESTONES } from "@/src/data/milestones";
import scss from "./Milestones.module.scss";

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

// The vertical line next to the list "draws itself" as the section
// scrolls through view — same useScroll/useTransform technique
// projects-sections/HeroImage.tsx already uses for its scroll-linked
// image transform, applied here to a scaleY instead.
const Milestones: FC = () => {
  const reduce = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 75%", "end 45%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className={scss.milestones}>
      <div className={`container ${scss.milestones__inner}`}>
        <span className={scss.milestones__eyebrow}>
          <span className={scss.milestones__index}>§ 02</span>
          Путь сообщества
        </span>
        <h2 className={scss.milestones__title}>Вехи</h2>

        <div ref={railRef} className={scss.rail}>
          <div className={scss.rail__track}>
            <motion.div
              className={scss.rail__fill}
              style={reduce ? { scaleY: 1 } : { scaleY: lineScale }}
            />
          </div>

          <ul className={scss.list}>
            {MILESTONES.map((milestone, index) => (
              <motion.li
                key={milestone.year + milestone.title}
                className={scss.item}
                initial={reduce ? undefined : "hidden"}
                whileInView={reduce ? undefined : "visible"}
                viewport={{ once: true, margin: "-80px" }}
                variants={reduce ? undefined : itemVariants}
                transition={{ delay: reduce ? 0 : index * 0.06, ...springs.gentle }}
              >
                <span className={scss.item__dot} aria-hidden="true" />
                <span className={scss.item__year}>{milestone.year}</span>
                <div className={scss.item__body}>
                  <h3 className={scss.item__title}>{milestone.title}</h3>
                  <p className={scss.item__description}>{milestone.description}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Milestones;
