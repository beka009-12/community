"use client";

import { FC, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import ProjectCover from "@/src/ui/ProjectCover";
import scss from "./HeroImage.module.scss";

// The only client-side piece of the otherwise static detail page.
const HeroImage: FC<{ src: string | null; name: string }> = ({ src, name }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1, 1.08]);
  const y = useTransform(scrollYProgress, [0, 1], [-24, 24]);

  return (
    <div ref={ref} className={scss.frame}>
      <motion.div className={scss.image} style={{ scale, y }}>
        <ProjectCover src={src} name={name} />
      </motion.div>
    </div>
  );
};

export default HeroImage;
