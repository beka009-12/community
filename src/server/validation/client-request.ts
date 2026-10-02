import { z } from "zod";
import { CATEGORY_LABELS, type ProjectCategory } from "@/src/data/projects";
import { optionalText, parseForm, requiredText } from "./form";

const categories = Object.keys(CATEGORY_LABELS) as [ProjectCategory, ...ProjectCategory[]];

export const clientRequestSchema = z.object({
  name: requiredText(2, 80, "Имя"),
  email: z.email("Проверьте email: например, name@company.kg"),
  title: requiredText(2, 120, "Название проекта"),
  description: requiredText(10, 2000, "Описание проекта"),
  company: optionalText(120),
  phone: optionalText(40),
  budget: optionalText(120),
  projectType: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(categories, "Выберите тип из списка").optional(),
  ),
});

export type ClientRequestFields = z.infer<typeof clientRequestSchema>;

export const parseClientRequest = (formData: FormData) =>
  parseForm(clientRequestSchema, formData);
