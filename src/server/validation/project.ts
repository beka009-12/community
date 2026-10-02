import { z } from "zod";
import { commaList, optionalUrl, parseForm, requiredText } from "./form";

const projectShape = {
  name: requiredText(2, 60, "Название"),
  description: requiredText(10, 200, "Короткое описание"),
  details: z.string().trim().max(2000, "Не больше 2000 символов"),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "PAUSED"], "Выберите статус"),
  category: z.enum(["web", "systems", "bots", "ai"], "Выберите категорию"),
  origin: z.enum(["community", "client"], "Выберите источник"),
  year: z.string().trim().regex(/^\d{4}$/, "Год из четырёх цифр"),
  image: z.url("Ссылка на превью целиком, с https://"),
  stack: commaList(12),
  demoUrl: optionalUrl(),
  githubUrl: optionalUrl(),
  // Unchecked checkboxes aren't sent at all.
  featured: z.preprocess((value) => value === "on", z.boolean()),
};

const projectUpdateSchema = z.object(projectShape);
const projectCreateSchema = z.object({
  ...projectShape,
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,40}$/, "Адрес: 2–40 символов, латиница, цифры и дефис"),
});

export const parseProjectUpdate = (formData: FormData) =>
  parseForm(projectUpdateSchema, formData);

export const parseProjectCreate = (formData: FormData) =>
  parseForm(projectCreateSchema, formData);
