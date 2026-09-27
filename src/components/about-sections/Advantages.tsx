import { FC, ReactNode } from "react";
import scss from "./Advantages.module.scss";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

// Paraphrases of claims already made elsewhere on the site (Stats,
// CommunityPreview) — nothing new is asserted here, just restated for
// someone who lands directly on /about.
const ADVANTAGES: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: "Реальные проекты, а не учебные",
    description: "Портфолио строится на проектах, которые реально идут в прод.",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path d="M3 13l9 5 9-5" />
      </svg>
    ),
  },
  {
    title: "Ревью на каждом этапе",
    description:
      "Тимлиды принимают архитектурные решения и проверяют код каждого участника.",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.4 12.3 11 15l4.6-6" />
      </svg>
    ),
  },
  {
    title: "Уже проверенные люди",
    description: "Компании нанимают не по резюме, а по тому, что человек реально сделал.",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-3 2.7-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
        <circle cx="17.5" cy="9" r="2.2" />
        <path d="M16.2 14.2c2.1.5 3.4 1.9 3.8 4.1" />
      </svg>
    ),
  },
];

const Advantages: FC = () => (
  <section className={scss.advantages}>
    <div className={`container ${scss.advantages__inner}`}>
      <h2 className={scss.advantages__title}>Почему мы</h2>

      <div className={scss.advantages__grid}>
        {ADVANTAGES.map((item) => (
          <div key={item.title} className={scss.advantage}>
            <span className={scss.advantage__icon}>{item.icon}</span>
            <h3 className={scss.advantage__title}>{item.title}</h3>
            <p className={scss.advantage__description}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Advantages;
