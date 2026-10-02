export type MemberStatus = "ACTIVE" | "INACTIVE";

// Structured résumé — what a member fills in under "My Resume" in the
// dashboard. `resume` below stays as the optional downloadable PDF.
export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  description?: string;
}

export interface EducationEntry {
  institution: string;
  program: string;
  period: string;
}

// Mirrors MemberProfile from the platform plan. `position` isn't stored —
// it's the specialization title, looked up via specializationId.
export interface Member {
  id: string;
  specializationId: string;
  firstName: string;
  lastName: string;
  role: string;
  stack: string;
  photo: string;
  bio: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  resume?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  status: MemberStatus;
}

const PLACEHOLDER_PHOTO = "/team/placeholder-1.webp";

// TODO: placeholder roster — no real member accounts exist yet (only
// Admin can create them, and none have been created). Small fixed
// example set: one team lead + one developer per specialization, using
// the shared placeholder photo and the same "Тимлид X / X-разработчик"
// role-naming convention already used in CommunityPreview — never a
// fabricated personal name: firstName/lastName are explicit
// "Участник NN" stand-ins, and résumé entries use the same convention
// ("Компания 01", "Университет 01"). Links point at bare domains like
// socials.ts.
// Swap in real profile data as accounts get created; no other code
// needs to change.
export const MEMBERS: Member[] = [
  {
    id: "frontend-lead",
    firstName: "Участник",
    lastName: "01",
    specializationId: "frontend",
    role: "Тимлид Frontend",
    stack: "React · Next.js",
    photo: PLACEHOLDER_PHOTO,
    bio: "Ведёт frontend в командах сообщества: архитектура интерфейса, ревью кода, онбординг новых участников.",
    skills: ["React", "Next.js", "TypeScript", "SCSS", "Code review"],
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
    experience: [
      { company: "Компания 01", role: "Frontend-разработчик", period: "2025 — сейчас", description: "Интерфейсы внутренней CRM на React и Next.js." },
      { company: "Компания 02", role: "Junior frontend-разработчик", period: "2024 — 2025", description: "Вёрстка и поддержка клиентских кабинетов." },
      { company: "Компания 03", role: "Стажёр-разработчик", period: "2024", description: "Компоненты дизайн-системы и тесты." },
      { company: "Фриланс", role: "Frontend-разработчик", period: "2023 — 2024", description: "Лендинги для малого бизнеса." },
    ],
    education: [
      { institution: "Motion", program: "Frontend-трек", period: "2023 — 2024" },
      { institution: "Университет 01", program: "Прикладная информатика", period: "2019 — 2023" },
    ],
    status: "ACTIVE",
  },
  {
    id: "frontend-dev",
    firstName: "Участник",
    lastName: "02",
    specializationId: "frontend",
    role: "Frontend-разработчик",
    stack: "React · TypeScript",
    photo: PLACEHOLDER_PHOTO,
    bio: "Собирает интерфейсы по макетам и подключает их к API. Работал над внутренними системами и кабинетами.",
    skills: ["React", "TypeScript", "React Query", "Адаптивная вёрстка"],
    experience: [],
    education: [
      { institution: "Motion", program: "Frontend-трек", period: "2024 — 2025" },
    ],
    status: "ACTIVE",
  },
  {
    id: "backend-lead",
    firstName: "Участник",
    lastName: "03",
    specializationId: "backend",
    role: "Тимлид Backend",
    stack: "NestJS · PostgreSQL",
    photo: PLACEHOLDER_PHOTO,
    bio: "Проектирует API и схемы данных, отвечает за backend-архитектуру и деплой проектов команды.",
    skills: ["NestJS", "PostgreSQL", "Docker", "REST API", "Code review"],
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
    experience: [
      { company: "Компания 04", role: "Backend-разработчик", period: "2024 — сейчас", description: "API и интеграции с платёжными системами." },
      { company: "Компания 05", role: "Junior backend-разработчик", period: "2023 — 2024" },
    ],
    education: [
      { institution: "Motion", program: "Backend-трек", period: "2023 — 2024" },
      { institution: "Университет 01", program: "Прикладная информатика", period: "2019 — 2023" },
    ],
    status: "ACTIVE",
  },
  {
    id: "backend-dev",
    firstName: "Участник",
    lastName: "04",
    specializationId: "backend",
    role: "Backend-разработчик",
    stack: "FastAPI · PostgreSQL",
    photo: PLACEHOLDER_PHOTO,
    bio: "Пишет сервисы и интеграции на Python: от моделей данных до фоновых задач.",
    skills: ["FastAPI", "PostgreSQL", "SQLAlchemy", "Docker"],
    experience: [],
    education: [
      { institution: "Motion", program: "Backend-трек", period: "2024 — 2025" },
    ],
    status: "ACTIVE",
  },
  {
    id: "fullstack-lead",
    firstName: "Участник",
    lastName: "05",
    specializationId: "fullstack",
    role: "Тимлид Fullstack",
    stack: "React · Node.js",
    photo: PLACEHOLDER_PHOTO,
    bio: "Ведёт небольшие проекты целиком — от интерфейса до базы данных и деплоя.",
    skills: ["React", "Node.js", "PostgreSQL", "Docker"],
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
    experience: [
      { company: "Компания 06", role: "Fullstack-разработчик", period: "2024 — сейчас", description: "Внутренние инструменты на React и Node.js." },
    ],
    education: [
      { institution: "Motion", program: "Fullstack-трек", period: "2023 — 2024" },
      { institution: "Университет 01", program: "Прикладная информатика", period: "2019 — 2023" },
    ],
    status: "ACTIVE",
  },
  {
    id: "fullstack-dev",
    firstName: "Участник",
    lastName: "06",
    specializationId: "fullstack",
    role: "Fullstack-разработчик",
    stack: "React · NestJS",
    photo: PLACEHOLDER_PHOTO,
    bio: "Работает на обеих сторонах: интерфейсы на React и API на NestJS.",
    skills: ["React", "NestJS", "TypeScript", "PostgreSQL"],
    experience: [],
    education: [
      { institution: "Motion", program: "Fullstack-трек", period: "2024 — 2025" },
    ],
    status: "ACTIVE",
  },
  {
    id: "ai-lead",
    firstName: "Участник",
    lastName: "07",
    specializationId: "ai",
    role: "Тимлид AI/ML",
    stack: "Python · LLM",
    photo: PLACEHOLDER_PHOTO,
    bio: "Отвечает за AI-часть проектов: выбор моделей, интеграцию LLM и компьютерного зрения в продукт.",
    skills: ["Python", "LLM", "OpenCV", "FastAPI"],
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
    experience: [
      { company: "Компания 07", role: "ML-инженер", period: "2024 — сейчас", description: "Распознавание документов и LLM-ассистенты." },
    ],
    education: [
      { institution: "Motion", program: "AI/ML-трек", period: "2023 — 2024" },
      { institution: "Университет 01", program: "Прикладная информатика", period: "2019 — 2023" },
    ],
    status: "ACTIVE",
  },
  {
    id: "ai-dev",
    firstName: "Участник",
    lastName: "08",
    specializationId: "ai",
    role: "AI/ML-инженер",
    stack: "Python · OpenCV",
    photo: PLACEHOLDER_PHOTO,
    bio: "Решает задачи компьютерного зрения и обработки данных для проектов сообщества.",
    skills: ["Python", "OpenCV", "NumPy", "PyTorch"],
    experience: [],
    education: [
      { institution: "Motion", program: "AI/ML-трек", period: "2024 — 2025" },
    ],
    status: "ACTIVE",
  },
  {
    id: "design-lead",
    firstName: "Участник",
    lastName: "09",
    specializationId: "design",
    role: "Тимлид UI/UX",
    stack: "Figma",
    photo: PLACEHOLDER_PHOTO,
    bio: "Ведёт дизайн в командах: исследования, прототипы и дизайн-системы.",
    skills: ["Figma", "UX-исследования", "Дизайн-системы", "Прототипирование"],
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
    experience: [
      { company: "Компания 08", role: "Продуктовый дизайнер", period: "2024 — сейчас", description: "Дизайн-система и мобильное приложение." },
    ],
    education: [
      { institution: "Motion", program: "UI/UX-трек", period: "2023 — 2024" },
      { institution: "Университет 01", program: "Прикладная информатика", period: "2019 — 2023" },
    ],
    status: "ACTIVE",
  },
  {
    id: "design-dev",
    firstName: "Участник",
    lastName: "10",
    specializationId: "design",
    role: "UI/UX-дизайнер",
    stack: "Figma",
    photo: PLACEHOLDER_PHOTO,
    bio: "Проектирует интерфейсы и готовит макеты к передаче в разработку.",
    skills: ["Figma", "UI-дизайн", "Адаптивные макеты"],
    experience: [],
    education: [
      { institution: "Motion", program: "UI/UX-трек", period: "2024 — 2025" },
    ],
    status: "ACTIVE",
  },
  {
    id: "qa-lead",
    firstName: "Участник",
    lastName: "11",
    specializationId: "qa",
    role: "Тимлид QA",
    stack: "Auto QA",
    photo: PLACEHOLDER_PHOTO,
    bio: "Выстраивает процесс тестирования и автотесты для проектов команды.",
    skills: ["Автотесты", "Playwright", "Тест-планы", "CI"],
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
    experience: [
      { company: "Компания 09", role: "QA-инженер", period: "2024 — сейчас", description: "Автотесты на Playwright и CI." },
    ],
    education: [
      { institution: "Motion", program: "QA-трек", period: "2023 — 2024" },
      { institution: "Университет 01", program: "Прикладная информатика", period: "2019 — 2023" },
    ],
    status: "ACTIVE",
  },
  {
    id: "qa-dev",
    firstName: "Участник",
    lastName: "12",
    specializationId: "qa",
    role: "QA-инженер",
    stack: "Manual QA",
    photo: PLACEHOLDER_PHOTO,
    bio: "Проверяет функциональность перед релизом и описывает баги так, чтобы их было легко воспроизвести.",
    skills: ["Ручное тестирование", "Тест-кейсы", "Postman"],
    experience: [],
    education: [
      { institution: "Motion", program: "QA-трек", period: "2024 — 2025" },
    ],
    status: "ACTIVE",
  },
  {
    id: "mobile-lead",
    firstName: "Участник",
    lastName: "13",
    specializationId: "mobile",
    role: "Тимлид Mobile",
    stack: "React Native",
    photo: PLACEHOLDER_PHOTO,
    bio: "Ведёт мобильную разработку: архитектура приложений и публикация в сторах.",
    skills: ["React Native", "TypeScript", "Expo"],
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
    experience: [
      { company: "Компания 10", role: "Mobile-разработчик", period: "2024 — сейчас", description: "Приложение доставки на React Native." },
    ],
    education: [
      { institution: "Motion", program: "Mobile-трек", period: "2023 — 2024" },
      { institution: "Университет 01", program: "Прикладная информатика", period: "2019 — 2023" },
    ],
    status: "ACTIVE",
  },
  {
    id: "mobile-dev",
    firstName: "Участник",
    lastName: "14",
    specializationId: "mobile",
    role: "Mobile-разработчик",
    stack: "React Native",
    photo: PLACEHOLDER_PHOTO,
    bio: "Собирает мобильные экраны на React Native и подключает их к API.",
    skills: ["React Native", "TypeScript"],
    experience: [],
    education: [
      { institution: "Motion", program: "Mobile-трек", period: "2024 — 2025" },
    ],
    status: "ACTIVE",
  },
];

export const getMemberName = (member: Member) =>
  `${member.firstName} ${member.lastName}`;

export const isTeamLead = (member: Member) => member.role.startsWith("Тимлид");

// Only ACTIVE members are public; INACTIVE ones are kept for history.
export const PUBLIC_MEMBERS = MEMBERS.filter((member) => member.status === "ACTIVE");

export const getPublicMember = (id: string) =>
  PUBLIC_MEMBERS.find((member) => member.id === id);
