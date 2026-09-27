"use client";

import { FC, MouseEvent, ReactNode, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { CATEGORY_LABELS, type ProjectCategory } from "@/src/data/projects";
import scss from "./ServiceQuickNav.module.scss";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

// Same 4 categories ServicesPreview and the Projects filter already use —
// this isn't a new taxonomy, just a fast lane into the existing one.
const ICONS: Record<ProjectCategory, ReactNode> = {
  web: (
    <svg {...ICON_PROPS}>
      <path d="M9.5 7 5 12l4.5 5" />
      <path d="M14.5 7 19 12l-4.5 5" />
    </svg>
  ),
  systems: (
    <svg {...ICON_PROPS}>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <circle cx="7" cy="7" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  bots: (
    <svg {...ICON_PROPS}>
      <path d="M21.5 2.5 10.8 13.2" />
      <path d="M21.5 2.5 14.9 21l-4-7.8-7.8-4 18.4-6.7Z" />
    </svg>
  ),
  ai: (
    <svg {...ICON_PROPS}>
      <path d="M12 3v3" />
      <rect x="5" y="9" width="14" height="11" rx="3" />
      <circle cx="9.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9 18h6" />
    </svg>
  ),
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProjectCategory[];
const HIGHLIGHT_MS = 1600;
const HIGHLIGHT_CLASS = "service-quicknav-highlight";

const MagneticPill: FC<{
  category: ProjectCategory;
  reduce: boolean;
  onSelect: (category: ProjectCategory) => void;
}> = ({ category, reduce, onSelect }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const springX = useSpring(mvX, { stiffness: 300, damping: 20, mass: 0.4 });
  const springY = useSpring(mvY, { stiffness: 300, damping: 20, mass: 0.4 });

  const handleMove = (event: MouseEvent<HTMLButtonElement>) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    // Nudge toward the cursor, capped to a third of the offset — a hint
    // of magnetism, not the pill chasing the pointer off its own axis.
    mvX.set((event.clientX - rect.left - rect.width / 2) * 0.35);
    mvY.set((event.clientY - rect.top - rect.height / 2) * 0.35);
  };

  const handleLeave = () => {
    mvX.set(0);
    mvY.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      className={scss.pill}
      style={reduce ? undefined : { x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={() => onSelect(category)}
    >
      <span className={scss.pill__icon}>{ICONS[category]}</span>
      {CATEGORY_LABELS[category]}
    </motion.button>
  );
};

// Jumps straight to the matching card in ServicesPreview (reused as-is
// further down the page) and pulses it, so "what do you need" turns into
// looking at the answer within one click instead of a scroll-and-hunt.
const ServiceQuickNav: FC = () => {
  const reduce = useReducedMotion();

  const handleSelect = (category: ProjectCategory) => {
    const target = document.querySelector<HTMLElement>(`[data-category="${category}"]`);
    if (!target) return;

    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "center",
    });
    target.classList.add(HIGHLIGHT_CLASS);
    window.setTimeout(() => target.classList.remove(HIGHLIGHT_CLASS), HIGHLIGHT_MS);
  };

  return (
    <div className={scss.nav}>
      <span className={scss.nav__label}>Что вам нужно?</span>
      <div className={scss.nav__pills}>
        {CATEGORIES.map((category) => (
          <MagneticPill
            key={category}
            category={category}
            reduce={!!reduce}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default ServiceQuickNav;
