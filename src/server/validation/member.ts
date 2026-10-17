import { z } from "zod";
import { POSITIONS, USER_ROLES } from "@/src/lib/api-enums";
import { nullableUrl, parseForm, requiredText } from "./form";

export const LOGIN_PATTERN = /^[a-z0-9._-]{3,32}$/;

const login = z
  .string()
  .trim()
  .toLowerCase()
  .regex(LOGIN_PATTERN, "3–32 символа: латиница, цифры, точка, _ или -");

const role = z.enum(USER_ROLES, "Выберите роль");

export const passwordSchema = z
  .string()
  .min(8, "Минимум 8 символов")
  .max(64, "Не больше 64 символов");

// POST /admin/members/ takes exactly these three.
const memberCreateSchema = z.object({ login, password: passwordSchema, role });

// Profile part of PATCH /admin/members/{id}/. A blank position means
// "leave it as it is".
const memberProfileSchema = z.object({
  login,
  first_name: requiredText(1, 150, "Имя"),
  last_name: requiredText(1, 150, "Фамилия"),
  position: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(POSITIONS, "Выберите направление").optional(),
  ),
  bio: z.string().trim().max(2000, "Не больше 2000 символов"),
  skills: z.string().trim().max(500, "Не больше 500 символов"),
  github: nullableUrl(),
  linkedin: nullableUrl(),
  portfolio: nullableUrl(),
});

const roleSchema = z.object({ role });

export type MemberCreateFields = z.infer<typeof memberCreateSchema>;
export type MemberProfileFields = z.infer<typeof memberProfileSchema>;

export const parseMemberCreate = (formData: FormData) => parseForm(memberCreateSchema, formData);
export const parseMemberProfile = (formData: FormData) => parseForm(memberProfileSchema, formData);
export const parseRole = (formData: FormData) => parseForm(roleSchema, formData);
