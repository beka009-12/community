import { z } from "zod";
import { REQUEST_STATUSES } from "@/src/lib/api-enums";
import { parseForm } from "./form";

const requestStatusSchema = z.object({
  status: z.enum(REQUEST_STATUSES, "Выберите статус из списка"),
});

export const parseRequestStatus = (formData: FormData) =>
  parseForm(requestStatusSchema, formData);
