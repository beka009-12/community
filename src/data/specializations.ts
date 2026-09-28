export interface Specialization {
  id: string;
  title: string;
  description: string;
  stack: string;
}

// Matches the `position` examples from the platform spec (Frontend/Backend/
// Fullstack/UI-UX/QA/Mobile) plus AI/ML, which already appears elsewhere in
// the codebase (Academy's AI track, CommunityPreview's AI tab, projects.ts).
// Stack strings reuse the same real technologies already asserted in
// projects.ts and CommunityPreview — nothing invented here.
export const SPECIALIZATIONS: Specialization[] = [
  {
    id: "frontend",
    title: "Frontend Developer",
    description: "Собирают интерфейсы на React и Next.js — от макета до продакшна.",
    stack: "React · Next.js",
  },
  {
    id: "backend",
    title: "Backend Developer",
    description: "Строят API и архитектуру данных для CRM, LMS и внутренних систем.",
    stack: "NestJS · FastAPI · PostgreSQL",
  },
  {
    id: "fullstack",
    title: "Fullstack Developer",
    description: "Ведут проект от интерфейса до базы данных, когда команда небольшая.",
    stack: "React · Node.js",
  },
  {
    id: "ai",
    title: "AI/ML Engineer",
    description: "Внедряют AI-интеграции и модели в реальные продакшн-продукты.",
    stack: "Python · LLM",
  },
  {
    id: "design",
    title: "UI/UX Designer",
    description: "Проектируют интерфейсы и пользовательские сценарии до старта разработки.",
    stack: "Figma",
  },
  {
    id: "qa",
    title: "QA Engineer",
    description: "Тестируют функциональность и следят за качеством перед релизом.",
    stack: "Manual & Auto QA",
  },
  {
    id: "mobile",
    title: "Mobile Developer",
    description: "Разрабатывают мобильные приложения для iOS и Android.",
    stack: "React Native",
  },
];
