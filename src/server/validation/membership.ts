import { z } from "zod";
import { MEMBERSHIP_ROLES } from "@/src/lib/api-enums";
import { parseForm } from "./form";

// Shared by teams and projects: `user` and `role` exactly as the API takes them.
const membershipSchema = z.object({
  user: z.coerce.number({ error: "Выберите участника" }).int().positive("Выберите участника"),
  role: z.enum(MEMBERSHIP_ROLES, "Выберите роль"),
});

export const parseMembership = (formData: FormData) => parseForm(membershipSchema, formData);
