"use client";

import { FC, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import scss from "./HeroImage.module.scss";

// The only client-side piece of the (otherwise static) detail page —
// isolated here so the rest of ProjectDetail can stay a Server Component.
const HeroImage: FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1, 1.08]);
  const y = useTransform(scrollYProgress, [0, 1], [-24, 24]);

  return (
    <div ref={ref} className={scss.frame}>
      <motion.img
        src={src}
        alt={alt}
        className={scss.image}
        style={{ scale, y }}
      />
    </div>
  );
};

export default HeroImage;
