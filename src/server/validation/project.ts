import { z } from "zod";
import { PROJECT_STATUSES } from "@/src/lib/api-enums";
import { nullableUrl, parseForm, requiredText } from "./form";

// Field names and limits from the API's ProjectDetail.
const projectSchema = z.object({
  name: requiredText(2, 150, "Название"),
  description: requiredText(10, 2000, "Описание"),
  project_status: z.enum(PROJECT_STATUSES, "Выберите статус"),
  category: requiredText(1, 150, "Категория"),
  demo_url: nullableUrl(),
  github_url: nullableUrl(),
});

export type ProjectFields = z.infer<typeof projectSchema>;

export const parseProject = (formData: FormData) => parseForm(projectSchema, formData);
