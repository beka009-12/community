import { z } from "zod";
import { SPECIALIZATIONS } from "@/src/data/specializations";
import { commaList, optionalText, optionalUrl, parseForm, requiredText } from "./form";

const specializationIds = SPECIALIZATIONS.map((spec) => spec.id) as [string, ...string[]];

export const LOGIN_PATTERN = /^[a-z0-9._-]{3,32}$/;

const memberShape = {
  login: z
    .string()
    .trim()
    .toLowerCase()
    .regex(LOGIN_PATTERN, "3–32 символа: латиница, цифры, точка, _ или -"),
  role: z.enum(["TEAM_LEAD", "DEVELOPER"], "Выберите роль"),
  firstName: requiredText(1, 40, "Имя"),
  lastName: requiredText(1, 40, "Фамилия"),
  specializationId: z.enum(specializationIds, "Выберите направление"),
  roleTitle: requiredText(2, 60, "Должность"),
  stack: z.string().trim().max(80, "Не больше 80 символов"),
  bio: z.string().trim().max(600, "Не больше 600 символов"),
  skills: commaList(20),
  github: optionalUrl(),
  linkedin: optionalUrl(),
  portfolio: optionalUrl(),
  photo: optionalText(300),
};

export const passwordSchema = z
  .string()
  .min(8, "Минимум 8 символов")
  .max(64, "Не больше 64 символов");

const memberUpdateSchema = z.object(memberShape);
const memberCreateSchema = z.object({ ...memberShape, password: passwordSchema });

export type MemberUpdateFields = z.infer<typeof memberUpdateSchema>;
export type MemberCreateFields = z.infer<typeof memberCreateSchema>;

const memberProfileSchema = z.object(memberShape).omit({ login: true, role: true, photo: true });
const roleSchema = z.object({ role: memberShape.role });

export const parseMemberProfile = (formData: FormData) =>
  parseForm(memberProfileSchema, formData);

export const parseRole = (formData: FormData) => parseForm(roleSchema, formData);

export const parseMemberUpdate = (formData: FormData) =>
  parseForm(memberUpdateSchema, formData);

export const parseMemberCreate = (formData: FormData) =>
  parseForm(memberCreateSchema, formData);
