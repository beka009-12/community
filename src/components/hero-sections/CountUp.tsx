"use client";

import { FC } from "react";
import { useCountUp } from "@/src/hooks/use-count-up";

const CountUp: FC<{ value: number }> = ({ value }) => {
  const { ref, value: shown } = useCountUp(value);
  return <span ref={ref}>{shown}</span>;
};

export default CountUp;
