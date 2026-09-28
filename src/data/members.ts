export interface Member {
  id: string;
  specializationId: string;
  role: string;
  stack: string;
  photo: string;
}

const PLACEHOLDER_PHOTO = "/team/placeholder-1.webp";

// TODO: placeholder roster — no real member accounts exist yet (only
// Admin can create them, and none have been created). Small fixed
// example set: one team lead + one developer per specialization, using
// the shared placeholder photo and the same "Тимлид X / X-разработчик"
// role-naming convention already used in projects.ts and
// CommunityPreview — never a fabricated personal name. Swap `photo`
// (and add real names, once the data model supports them) as accounts
// get created; no other code needs to change.
export const MEMBERS: Member[] = [
  { id: "frontend-lead", specializationId: "frontend", role: "Тимлид Frontend", stack: "React · Next.js", photo: PLACEHOLDER_PHOTO },
  { id: "frontend-dev", specializationId: "frontend", role: "Frontend-разработчик", stack: "React · TypeScript", photo: PLACEHOLDER_PHOTO },
  { id: "backend-lead", specializationId: "backend", role: "Тимлид Backend", stack: "NestJS · PostgreSQL", photo: PLACEHOLDER_PHOTO },
  { id: "backend-dev", specializationId: "backend", role: "Backend-разработчик", stack: "FastAPI · PostgreSQL", photo: PLACEHOLDER_PHOTO },
  { id: "fullstack-lead", specializationId: "fullstack", role: "Тимлид Fullstack", stack: "React · Node.js", photo: PLACEHOLDER_PHOTO },
  { id: "fullstack-dev", specializationId: "fullstack", role: "Fullstack-разработчик", stack: "React · NestJS", photo: PLACEHOLDER_PHOTO },
  { id: "ai-lead", specializationId: "ai", role: "Тимлид AI/ML", stack: "Python · LLM", photo: PLACEHOLDER_PHOTO },
  { id: "ai-dev", specializationId: "ai", role: "AI/ML-инженер", stack: "Python · OpenCV", photo: PLACEHOLDER_PHOTO },
  { id: "design-lead", specializationId: "design", role: "Тимлид UI/UX", stack: "Figma", photo: PLACEHOLDER_PHOTO },
  { id: "design-dev", specializationId: "design", role: "UI/UX-дизайнер", stack: "Figma", photo: PLACEHOLDER_PHOTO },
  { id: "qa-lead", specializationId: "qa", role: "Тимлид QA", stack: "Auto QA", photo: PLACEHOLDER_PHOTO },
  { id: "qa-dev", specializationId: "qa", role: "QA-инженер", stack: "Manual QA", photo: PLACEHOLDER_PHOTO },
  { id: "mobile-lead", specializationId: "mobile", role: "Тимлид Mobile", stack: "React Native", photo: PLACEHOLDER_PHOTO },
  { id: "mobile-dev", specializationId: "mobile", role: "Mobile-разработчик", stack: "React Native", photo: PLACEHOLDER_PHOTO },
];
