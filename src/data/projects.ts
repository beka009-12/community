export type ProjectStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "PAUSED";
export type ProjectOrigin = "community" | "client";
export type ProjectCategory = "web" | "systems" | "bots" | "ai";

// No real member profiles exist yet (the /team page is still a stub, and
// there's no backend behind any of this), so members are identified by
// role only — same convention the homepage's CommunityPreview section
// already uses, never a fabricated personal name.
export interface ProjectTeamMember {
  role: string;
  stack: string;
}

export interface Project {
  slug: string;
  name: string;
  origin: ProjectOrigin;
  category: ProjectCategory;
  status: ProjectStatus;
  year: string;
  image: string;
  description: string;
  details: string;
  stack: string[];
  team: ProjectTeamMember[];
  demoUrl?: string;
  githubUrl?: string;
  featured: boolean;
}

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  web: "Лендинги и сайты",
  systems: "Веб-системы",
  bots: "Telegram-боты",
  ai: "AI-интеграции",
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: "В планах",
  IN_PROGRESS: "В разработке",
  COMPLETED: "Готово",
  PAUSED: "На паузе",
};

// Maps a status to the CSS modifier suffix (`status--<tone>`) each
// component uses for its color. Centralized so Grid, EditorialList,
// ProjectDetail and the status filter all agree on the same tone.
export const STATUS_TONE: Record<ProjectStatus, string> = {
  PLANNED: "neutral",
  IN_PROGRESS: "accent",
  COMPLETED: "positive",
  PAUSED: "muted",
};

const PLACEHOLDER_IMAGE =
  "https://media.licdn.com/dms/image/v2/D5612AQFXy7QydmMrhA/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1685812646776?e=2147483647&v=beta&t=YyZLphSZuSvI9YR3nT_pnQyC32MibQBOiHzkXgLm2PA";

export const PROJECTS: Project[] = [
  {
    slug: "amanat",
    name: "Amanat",
    origin: "community",
    category: "systems",
    status: "COMPLETED",
    year: "2026",
    image:
      "https://media.geeksforgeeks.org/wp-content/cdn-uploads/20210401151214/What-is-Website.png",
    description:
      "Платформа учёта и прозрачной отчётности для благотворительных сборов.",
    details:
      "Система помогает создавать сборы, отслеживать поступления и формировать понятные отчёты для пользователей и администраторов.",
    stack: ["React", "FastAPI", "PostgreSQL"],
    team: [
      { role: "Тимлид Frontend", stack: "React · Next.js" },
      { role: "Backend-разработчик", stack: "FastAPI · PostgreSQL" },
    ],
    featured: true,
  },
  {
    slug: "ibo",
    name: "IBO",
    origin: "community",
    category: "systems",
    status: "COMPLETED",
    year: "2026",
    image:
      "https://cdn.prod.website-files.com/65e76c61affc97a7f07d478e/65f6b369e7bc08dbe3dca2c9_65dd1467f9f0c10d4de2614d_WebGraphics_2024_Launch.webp",
    description:
      "Информационная система для управления школьным документооборотом.",
    details:
      "Централизованная система для работы с документами, пользователями и внутренними процессами образовательной организации.",
    stack: ["React", "NestJS", "PostgreSQL"],
    team: [
      { role: "Тимлид Backend", stack: "NestJS · PostgreSQL" },
      { role: "Frontend-разработчик", stack: "React · TypeScript" },
    ],
    featured: true,
  },
  {
    slug: "tabel",
    name: "Tabel",
    origin: "community",
    category: "ai",
    status: "IN_PROGRESS",
    year: "2026",
    image:
      "https://s3-figma-hubfile-images-production-cdn-cgi.figma.com/cdn-cgi/image/format=auto,quality=85/hub/file/carousel/img/c4a6bd7cfc75f912cc5de90aa079b83fbd1cfb93",
    description: "Сервис учёта рабочего времени и посещаемости для команд.",
    details:
      "Автоматизирует регистрацию посещаемости, хранение истории и формирование статистики по сотрудникам и рабочему времени.",
    stack: ["React", "FastAPI", "OpenCV"],
    team: [
      { role: "AI/ML-инженер", stack: "Python · OpenCV" },
      { role: "Frontend-разработчик", stack: "React · TypeScript" },
    ],
    featured: true,
  },
  // Проекты на заказ — placeholder-контент, ждёт реальных данных
  // (названия, описания, скриншоты, ссылки).
  {
    slug: "vitrina",
    name: "Vitrina",
    origin: "client",
    category: "bots",
    status: "IN_PROGRESS",
    year: "2026",
    image:
      "https://cdn.prod.website-files.com/5e305a6cb7083222527a89cc/675c402da6e599710158a5bc_61449d3a6be9f9a81d91af23_sports%2520direct.jpeg",
    description:
      "Telegram-бот для приёма заказов с админ-панелью для ресторана.",
    details:
      "Клиенты оформляют заказ прямо в Telegram, а команда ресторана ведёт меню, статусы заказов и доставку в отдельной панели.",
    stack: ["React", "NestJS", "PostgreSQL"],
    team: [
      { role: "Тимлид Frontend", stack: "React · Next.js" },
      { role: "Backend-разработчик", stack: "NestJS · PostgreSQL" },
    ],
    featured: false,
  },
  {
    slug: "karta",
    name: "Karta",
    origin: "client",
    category: "systems",
    status: "COMPLETED",
    year: "2025",
    image:
      "https://uizard.io/static/7fa6e1f25ef51ae47a7fc70515012451/a8e47/1a259d292d98ea09b55cd9c7efd5b4b7b19d9d52-1440x835.png",
    description: "Панель отслеживания доставок для логистической компании.",
    details:
      "Диспетчеры видят все рейсы на карте в реальном времени, а клиенты получают ссылку для отслеживания своей посылки.",
    stack: ["React", "FastAPI", "PostgreSQL"],
    team: [
      { role: "Frontend-разработчик", stack: "React · TypeScript" },
      { role: "Backend-разработчик", stack: "FastAPI · PostgreSQL" },
    ],
    featured: false,
  },
  {
    slug: "salamat",
    name: "Salamat",
    origin: "client",
    category: "ai",
    status: "PLANNED",
    year: "2026",
    image:
      "https://www.yo-kart.com/blog/wp-content/uploads/2018/06/Five_Inspirational_Marketplaces_Yokart-.png",
    description: "AI-ассистент записи и первичной сортировки для клиники.",
    details:
      "Чат-бот собирает жалобы пациента, подсказывает нужного врача и бронирует свободный слот без участия администратора.",
    stack: ["Python", "LLM", "PostgreSQL"],
    team: [
      { role: "AI/ML-инженер", stack: "Python · LLM" },
      { role: "Backend-разработчик", stack: "FastAPI · PostgreSQL" },
    ],
    featured: false,
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return PROJECTS.filter((project) => project.featured);
}

/** Cycles to the previous/next project in list order, wrapping around. */
export function getAdjacentProjects(
  slug: string,
): { prev: Project; next: Project } | null {
  const index = PROJECTS.findIndex((project) => project.slug === slug);
  if (index === -1) return null;

  const prev = PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(index + 1) % PROJECTS.length];
  return { prev, next };
}
