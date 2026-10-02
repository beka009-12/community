import { z } from "zod";
import { parseForm, requiredText } from "./form";

const teamSchema = z.object({
  name: requiredText(2, 60, "Название"),
  description: z.string().trim().max(400, "Не больше 400 символов"),
});

// Shared by teams and projects: add/update a person with a role.
const membershipSchema = z.object({
  userId: z.string().trim().min(1, "Выберите участника"),
  role: z.enum(["TEAM_LEAD", "DEVELOPER"], "Выберите роль"),
});

export const parseTeam = (formData: FormData) => parseForm(teamSchema, formData);
export const parseMembership = (formData: FormData) => parseForm(membershipSchema, formData);
