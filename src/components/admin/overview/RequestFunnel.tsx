"use client";

import { FC } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "@/src/lib/motion-tokens";
import type { RequestStatus } from "@/src/server/db/types";
import scss from "./Overview.module.scss";

const FLOW: RequestStatus[] = ["NEW", "REVIEWING", "ACCEPTED", "IN_PROGRESS", "COMPLETED"];
// Plural forms: the funnel counts groups of requests.
const STAGE_LABELS: Record<RequestStatus, string> = {
  NEW: "Новые",
  REVIEWING: "На рассмотрении",
  ACCEPTED: "Приняты",
  IN_PROGRESS: "В работе",
  COMPLETED: "Завершены",
  REJECTED: "Отклонены",
};

const STEP_DELAY = motionTokens.duration.slow / FLOW.length;

// The overview's one motion moment: the rail draws left to right and
// each stage lights up — same rail-and-node language as /login and the
// member profile's project path.
const RequestFunnel: FC<{ counts: Record<RequestStatus, number> }> = ({ counts }) => {
  const reduce = useReducedMotion();

  return (
    <div className={scss.funnel}>
      <ol className={scss.funnel__flow}>
        <motion.span
          className={scss.funnel__rail}
          aria-hidden="true"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth }}
        />
        {FLOW.map((status, index) => (
          <motion.li
            key={status}
            className={`${scss.stage} ${counts[status] > 0 ? scss["stage--filled"] : ""}`}
            initial={reduce ? false : { opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ duration: motionTokens.duration.normal, delay: index * STEP_DELAY }}
          >
            <Link href={`/admin/requests#status-${status}`} className={scss.stage__link}>
              <span className={scss.stage__node} aria-hidden="true" />
              <span className={scss.stage__count}>{counts[status]}</span>
              <span className={scss.stage__label}>{STAGE_LABELS[status]}</span>
            </Link>
          </motion.li>
        ))}
      </ol>
      <Link href="/admin/requests#status-REJECTED" className={scss.funnel__rejected}>
        Отклонено: {counts.REJECTED}
      </Link>
    </div>
  );
};

export default RequestFunnel;
