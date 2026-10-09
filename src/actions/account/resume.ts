"use server";

import { revalidatePath } from "next/cache";
import {
  certificateResource,
  educationResource,
  languageResource,
  workResource,
} from "@/src/server/api/account";
import { requireRole } from "@/src/server/auth/dal";
import {
  parseCertificate,
  parseEducation,
  parseLanguage,
  parseWork,
} from "@/src/server/validation/account";
import type { ParseResult } from "@/src/server/validation/form";
import { echoValues, type ActionResult, type FormState } from "../form-state";
import { toActionError, toFormError } from "../handle-error";

// The résumé is private to its owner, so only the cabinet needs refreshing.
const refreshCabinet = () => revalidatePath("/account", "layout");

async function saveRow<T>(
  formData: FormData,
  parse: (formData: FormData) => ParseResult<T>,
  save: (data: T) => Promise<void>,
): Promise<FormState> {
  await requireRole();
  const values = echoValues(formData);
  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await save(parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshCabinet();
  return { ok: true, values };
}

async function removeRow(remove: () => Promise<void>): Promise<ActionResult> {
  await requireRole();
  try {
    await remove();
  } catch (error) {
    return toActionError(error);
  }
  refreshCabinet();
  return {};
}

export async function createWorkAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseWork, (data) => workResource.create(data));
}

export async function updateWorkAction(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseWork, (data) => workResource.update(id, data));
}

export async function deleteWorkAction(id: number): Promise<ActionResult> {
  return removeRow(() => workResource.remove(id));
}

export async function createEducationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseEducation, (data) => educationResource.create(data));
}

export async function updateEducationAction(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseEducation, (data) => educationResource.update(id, data));
}

export async function deleteEducationAction(id: number): Promise<ActionResult> {
  return removeRow(() => educationResource.remove(id));
}

export async function createLanguageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseLanguage, (data) => languageResource.create(data));
}

export async function updateLanguageAction(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseLanguage, (data) => languageResource.update(id, data));
}

export async function deleteLanguageAction(id: number): Promise<ActionResult> {
  return removeRow(() => languageResource.remove(id));
}

export async function createCertificateAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseCertificate, (data) => certificateResource.create(data));
}

export async function updateCertificateAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveRow(formData, parseCertificate, (data) => certificateResource.update(id, data));
}

export async function deleteCertificateAction(id: number): Promise<ActionResult> {
  return removeRow(() => certificateResource.remove(id));
}
