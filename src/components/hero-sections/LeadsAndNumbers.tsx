import { FC } from "react";
import Link from "next/link";
import Avatar from "@/src/ui/Avatar";
import { positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { plural } from "@/src/lib/plural";
import type { MemberListItem, Stats } from "@/src/server/api/schemas";
import CountUp from "./CountUp";
import scss from "./LeadsAndNumbers.module.scss";

interface LeadsAndNumbersProps {
  leads: MemberListItem[];
  stats: Stats;
}

// Live numbers from GET /stats/, shown exactly.
const numbersOf = (stats: Stats) => [
  {
    id: "members",
    value: stats.members_count,
    label: plural(stats.members_count, "участник", "участника", "участников"),
  },
  {
    id: "projects",
    value: stats.projects_count,
    label: plural(stats.projects_count, "проект", "проекта", "проектов"),
  },
  {
    id: "companies",
    value: stats.companies_count,
    label: plural(stats.companies_count, "компания", "компании", "компаний"),
  },
];

// `id="community"` sits on the section, not the leads tile, so the footer's
// «Специалисты» link still lands when there are no leads to show.
const LeadsAndNumbers: FC<LeadsAndNumbersProps> = ({ leads, stats }) => (
  <section id="community" className={scss.people}>
    <div className={`container ${scss.people__grid}`}>
      {leads.length > 0 && (
        <div className={`${scss.tile} ${scss.leads}`}>
          <h2 className={scss.leads__title}>Кто ведёт проекты</h2>
          <p className={scss.leads__lead}>
            Тимлиды принимают архитектурные решения и проверяют код каждого
            участника.
          </p>

          <ul className={scss.leads__list}>
            {leads.map((lead) => {
              const name = fullName(lead);
              const position = positionLabel(lead.position);
              return (
                <li key={lead.id}>
                  <Link href={`/team/${lead.id}`} className={scss.lead}>
                    <span className={scss.lead__avatar}>
                      <Avatar src={lead.avatar} name={name} />
                    </span>
                    <span className={scss.lead__text}>
                      <span className={scss.lead__name}>{name}</span>
                      <span className={scss.lead__role}>
                        {position ? `Тимлид, ${position}` : "Тимлид"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ul className={`${scss.tile} ${scss.numbers}`}>
        {numbersOf(stats).map((item) => (
          <li key={item.id} className={scss.number}>
            <span className={scss.number__value}>
              <CountUp value={item.value} />
            </span>
            <span className={scss.number__label}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default LeadsAndNumbers;
