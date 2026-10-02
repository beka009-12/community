import type { ProjectCategory } from "./projects";

export interface Service {
  category: ProjectCategory;
  // English label shown on the homepage cards; ServicesPreview's
  // [data-tag="..."] CSS variants key off it.
  tag: string;
  title: string;
  description: string;
  includes: string[];
  team: string[];
}

// Single source for both the homepage teaser (ServicesPreview) and the
// detailed About section (about-sections/Services). `category` matches
// ProjectCategory so each service can list its real example projects.
export const SERVICES: Service[] = [
  {
    category: "web",
    tag: "Landing & Sites",
    title: "Лендинги и сайты",
    description:
      "Быстрые маркетинговые сайты и корпоративные страницы на React и Next.js.",
    includes: [
      "Структура и тексты страниц",
      "Дизайн по брендбуку или с нуля",
      "Адаптивная вёрстка на Next.js",
      "Базовое SEO и подключение аналитики",
    ],
    team: ["UI/UX-дизайнер", "Frontend-разработчик"],
  },
  {
    category: "systems",
    tag: "Web-systems",
    title: "Веб-системы",
    description:
      "CRM, LMS и панели управления — сложная бизнес-логика в понятном интерфейсе.",
    includes: [
      "Проектирование ролей и бизнес-процессов",
      "API и база данных",
      "Интерфейс и админ-панель",
      "Тестирование перед релизом",
    ],
    team: ["Тимлид", "Backend-разработчик", "Frontend-разработчик", "QA-инженер"],
  },
  {
    category: "bots",
    tag: "Telegram-bots",
    title: "Telegram-боты",
    description:
      "Автоматизация процессов и коммуникации прямо в мессенджере клиента.",
    includes: [
      "Сценарии диалогов",
      "Интеграция с CRM или таблицами",
      "Админ-панель для управления",
      "Деплой и сопровождение",
    ],
    team: ["Backend-разработчик", "Frontend-разработчик"],
  },
  {
    category: "ai",
    tag: "AI-integrations",
    title: "AI-интеграции",
    description:
      "Чат-боты, компьютерное зрение и аналитика поверх готовых моделей.",
    includes: [
      "Подбор модели под задачу",
      "Интеграция LLM или компьютерного зрения",
      "API для вашего продукта",
      "Проверка качества на ваших данных",
    ],
    team: ["AI/ML-инженер", "Backend-разработчик"],
  },
];
