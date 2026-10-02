import { z } from "zod";
import { parseForm } from "./form";

export const REQUEST_STATUSES = [
  "NEW",
  "REVIEWING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
] as const;

const requestStatusSchema = z.object({
  status: z.enum(REQUEST_STATUSES, "Выберите статус из списка"),
});

export const parseRequestStatus = (formData: FormData) =>
  parseForm(requestStatusSchema, formData);
