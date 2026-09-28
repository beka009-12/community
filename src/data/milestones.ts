export interface Milestone {
  year: string;
  title: string;
  description: string;
}

// TODO: placeholder — swap in the real founding date and milestones.
// Order is chronological; keep "Сегодня" last.
export const MILESTONES: Milestone[] = [
  {
    year: "202X",
    title: "Старт сообщества",
    description: "Собрали первую группу разработчиков вокруг общих проектов.",
  },
  {
    year: "202X",
    title: "Первые проекты в проде",
    description: "Портфолио участников перестало быть учебным — пошли реальные релизы.",
  },
  {
    year: "202X",
    title: "Запуск Motion Academy",
    description: "Появилась образовательная площадка для будущих участников сообщества.",
  },
  {
    year: "Сегодня",
    title: "120+ участников",
    description: "Компании нанимают людей, уже проверенных на реальных задачах.",
  },
];
