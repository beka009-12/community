import { FC } from "react";
import { statsSentence } from "@/src/lib/stats-sentence";
import type { Stats } from "@/src/server/api/schemas";
import CountUp from "./CountUp";
import scss from "./StatsStatement.module.scss";

// The numbers as the showcase's conclusion: who builds all this. Carries
// `id="community"` for the footer's «Специалисты» link.
const StatsStatement: FC<{ stats: Stats }> = ({ stats }) => {
  const parts = statsSentence(stats);
  if (parts.length === 0) return null;

  return (
    <section id="community" className={scss.statement}>
      <div className="container">
        <p className={scss.statement__text}>
          {parts.map((part, index) =>
            typeof part === "number" ? (
              <strong key={index} className={scss.statement__number}>
                <CountUp value={part} />
              </strong>
            ) : (
              part
            ),
          )}
        </p>
      </div>
    </section>
  );
};

export default StatsStatement;
