"use client";

import { FC, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens } from "@/src/lib/motion-tokens";
import scss from "./ResumeTimeline.module.scss";

export interface TimelineEntry {
  title: string;
  subtitle: string;
  period: string;
  description?: string;
}

const VISIBLE_BY_DEFAULT = 3;

// Experience and education share one look: the same rail as
// ProjectPath, but static and neutral, so the project path stays the
// page's one accented moment. Long lists collapse to three entries.
const ResumeTimeline: FC<{ entries: TimelineEntry[] }> = ({ entries }) => {
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();
  const listId = useId();
  const hiddenCount = entries.length - VISIBLE_BY_DEFAULT;
  const visible = expanded ? entries : entries.slice(0, VISIBLE_BY_DEFAULT);

  return (
    <>
      <ol className={scss.timeline} id={listId}>
        <AnimatePresence initial={false}>
          {visible.map((entry, index) => (
            <motion.li
              key={`${entry.title}-${entry.period}`}
              className={scss.entry}
              initial={{
                opacity: 0,
                y: reduce ? 0 : -motionTokens.distance.xs,
              }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                transition: { duration: motionTokens.duration.instant },
              }}
              transition={{
                duration: motionTokens.duration.fast,
                delay:
                  expanded && index >= VISIBLE_BY_DEFAULT
                    ? 0.05 * (index - VISIBLE_BY_DEFAULT)
                    : 0,
              }}
            >
              <span className={scss.entry__node} aria-hidden="true" />
              <div className={scss.entry__head}>
                <h3 className={scss.entry__title}>{entry.title}</h3>
                <span className={scss.entry__period}>{entry.period}</span>
              </div>
              <p className={scss.entry__subtitle}>{entry.subtitle}</p>
              {entry.description && (
                <p className={scss.entry__description}>{entry.description}</p>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      {hiddenCount > 0 && (
        <button
          type="button"
          className={scss.toggle}
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Свернуть" : `Показать все (${entries.length})`}
        </button>
      )}
    </>
  );
};

export default ResumeTimeline;
