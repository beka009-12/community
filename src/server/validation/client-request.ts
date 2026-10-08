import { z } from "zod";
import { PROJECT_TYPES } from "@/src/data/services";
import { parseForm, requiredText } from "./form";

// "300 000" → 300000, blank → null: budget is optional and in som.
const budget = z.preprocess(
  (value) => (typeof value === "string" ? value.replace(/\s/g, "") : ""),
  z
    .string()
    .regex(/^\d{0,12}$/, "Укажите сумму цифрами, в сомах")
    .transform((value) => (value === "" ? null : Number(value))),
);

// Field names and limits from the API's ClientRequestCreate.
export const clientRequestSchema = z.object({
  name: requiredText(2, 150, "Имя"),
  company: requiredText(1, 150, "Компания"),
  email: z.email("Проверьте email: например, name@company.kg").max(254, "Не больше 254 символов"),
  phone: requiredText(1, 128, "Телефон"),
  title: requiredText(2, 150, "Название проекта"),
  description: requiredText(10, 2000, "Описание проекта"),
  project_type: z.enum(PROJECT_TYPES, "Выберите тип из списка"),
  budget,
});

export type ClientRequestFields = z.infer<typeof clientRequestSchema>;

export const parseClientRequest = (formData: FormData) =>
  parseForm(clientRequestSchema, formData);
