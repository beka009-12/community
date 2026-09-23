"use client";
import { useReducedMotion } from "motion/react";
import { motionTokens } from "@/src/lib/motion-tokens";

export function useSafeMotion(fullDistance: number = motionTokens.distance.md) {
  const reduce = useReducedMotion();
  return {
    reduce,
    initial: { opacity: 0, y: reduce ? 0 : fullDistance },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduce ? 0 : -fullDistance },
  };
}
