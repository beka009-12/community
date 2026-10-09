import { z } from "zod";
import { LANGUAGE_LEVELS, POSITIONS, WORKING_FORMATS } from "@/src/lib/api-enums";
import { nullableUrl, parseForm, requiredText } from "./form";
import { passwordSchema } from "./member";

const BEFORE_START = "Окончание не может быть раньше начала";

const requiredDate = z.iso.date("Укажите дату");
// Blank or absent (the end-date input is hidden while studying) → null.
const optionalDate = z.preprocess(
  (value) => (value === undefined || (typeof value === "string" && value.trim() === "") ? null : value),
  z.iso.date("Укажите дату").nullable(),
);
// "YYYY-MM-DD" strings compare correctly as text.
const notBefore = (start: string, end: string | null) => end === null || end >= start;
// Blank select → leave the field out of the request.
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T, message: string) =>
  z.preprocess((value) => (value === "" ? undefined : value), z.enum(values, message).optional());

// PATCH /personal-account/ profile part. role, login and status aren't
// fields here, so a tampered form can't send them.
const profileSchema = z.object({
  first_name: requiredText(1, 150, "Имя"),
  last_name: requiredText(1, 150, "Фамилия"),
  position: optionalEnum(POSITIONS, "Выберите направление"),
  bio: z.string().trim().max(2000, "Не больше 2000 символов"),
  skills: z.string().trim().max(500, "Не больше 500 символов"),
  github: nullableUrl(),
  linkedin: nullableUrl(),
  portfolio: nullableUrl(),
});

const passwordChangeSchema = z
  .object({ password: passwordSchema, password_repeat: z.string() })
  .refine((data) => data.password === data.password_repeat, {
    path: ["password_repeat"],
    message: "Пароли не совпадают",
  })
  .transform(({ password }) => ({ password }));

const workSchema = z
  .object({
    company: requiredText(1, 150, "Компания"),
    position: requiredText(1, 150, "Должность"),
    start_time: requiredDate,
    end_time: optionalDate,
    working_format: optionalEnum(WORKING_FORMATS, "Выберите формат из списка"),
    achievements: requiredText(1, 2000, "Достижения"),
  })
  .refine((data) => notBefore(data.start_time, data.end_time), { path: ["end_time"], message: BEFORE_START });

const educationSchema = z
  .object({
    educational_institution: requiredText(1, 150, "Учебное заведение"),
    specialization: requiredText(1, 150, "Специализация"),
    start_year: requiredDate,
    // An unticked checkbox isn't sent at all.
    studying_now: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
    end_year: optionalDate,
    responsibilities: requiredText(1, 2000, "Описание"),
  })
  .transform((data) => (data.studying_now ? { ...data, end_year: null } : data))
  .refine((data) => notBefore(data.start_year, data.end_year), { path: ["end_year"], message: BEFORE_START });

const languageSchema = z.object({
  languages: requiredText(1, 150, "Язык"),
  Level: z.enum(LANGUAGE_LEVELS, "Выберите уровень"),
});

const certificateSchema = z.object({
  title: requiredText(1, 150, "Название"),
  organization: requiredText(1, 150, "Организация"),
  given_date: requiredDate,
  text: requiredText(1, 2000, "Описание"),
});

export const parseProfile = (formData: FormData) => parseForm(profileSchema, formData);
export const parsePasswordChange = (formData: FormData) => parseForm(passwordChangeSchema, formData);
export const parseWork = (formData: FormData) => parseForm(workSchema, formData);
export const parseEducation = (formData: FormData) => parseForm(educationSchema, formData);
export const parseLanguage = (formData: FormData) => parseForm(languageSchema, formData);
export const parseCertificate = (formData: FormData) => parseForm(certificateSchema, formData);
