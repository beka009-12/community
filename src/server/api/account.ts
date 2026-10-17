import "server-only";
import { cache } from "react";
import { z, type ZodType } from "zod";
import type { LanguageLevel, Position, WorkingFormat } from "@/src/lib/api-enums";
import { authedDelete, authedGet, authedSend } from "./client";
import {
  certificateSchema,
  educationSchema,
  languageSchema,
  listOf,
  myProfileSchema,
  workSchema,
  type Account,
  type Certificate,
  type Education,
  type Language,
  type MyProfile,
  type Work,
} from "./schemas";

export const getMyProfile = cache((): Promise<MyProfile> => authedGet("/personal-account/", myProfileSchema));

// For callers that only need id, role and status.
export const getMyAccount = (): Promise<Account> => getMyProfile();

// No `role`, `login` or `status`: members can't change those here.
export interface ProfilePatch {
  first_name: string;
  last_name: string;
  position?: Position;
  bio: string;
  skills: string;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
}

export async function updateMyProfile(patch: ProfilePatch): Promise<void> {
  await authedSend("PATCH", "/personal-account/", patch, z.unknown());
}

export async function changeMyPassword(password: string): Promise<void> {
  await authedSend("PATCH", "/personal-account/", { password }, z.unknown());
}

export interface ResumeResource<Row, Write> {
  list(): Promise<Row[]>;
  create(data: Write): Promise<void>;
  update(id: number, data: Write): Promise<void>;
  remove(id: number): Promise<void>;
}

// The four résumé sections share one CRUD shape under /personal-account/.
function resumeResource<Row, Write>(path: string, schema: ZodType<Row>): ResumeResource<Row, Write> {
  return {
    list: cache((): Promise<Row[]> => authedGet(path, listOf(schema))),
    async create(data) {
      await authedSend("POST", path, data, z.unknown());
    },
    async update(id, data) {
      await authedSend("PATCH", `${path}${id}/`, data, z.unknown());
    },
    remove: (id) => authedDelete(`${path}${id}/`),
  };
}

export interface WorkWrite {
  company: string;
  position: string;
  start_time: string;
  end_time: string | null;
  working_format?: WorkingFormat;
  achievements: string;
}

export interface EducationWrite {
  educational_institution: string;
  specialization: string;
  start_year: string;
  end_year: string | null;
  studying_now: boolean;
  responsibilities: string;
}

export interface LanguageWrite {
  languages: string;
  Level: LanguageLevel;
}

export interface CertificateWrite {
  title: string;
  organization: string;
  given_date: string;
  text: string;
}

export const workResource = resumeResource<Work, WorkWrite>("/personal-account/work/", workSchema);
export const educationResource = resumeResource<Education, EducationWrite>(
  "/personal-account/education/",
  educationSchema,
);
export const languageResource = resumeResource<Language, LanguageWrite>("/personal-account/languages/", languageSchema);
export const certificateResource = resumeResource<Certificate, CertificateWrite>(
  "/personal-account/certificates/",
  certificateSchema,
);
