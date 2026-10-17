import { z } from "zod";
import { parseForm, requiredText } from "./form";

// Field names and limits from the API's TeamDetail.
const teamSchema = z.object({
  team_name: requiredText(2, 255, "Название"),
  description: z.string().trim().max(2000, "Не больше 2000 символов"),
});

export type TeamFields = z.infer<typeof teamSchema>;

export const parseTeam = (formData: FormData) => parseForm(teamSchema, formData);
