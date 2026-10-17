import { z } from "zod";
import {
  LANGUAGE_LEVELS,
  MEMBERSHIP_ROLES,
  POSITIONS,
  PROJECT_STATUSES,
  REQUEST_STATUSES,
  USER_ROLES,
  USER_STATUSES,
  WORKING_FORMATS,
} from "@/src/lib/api-enums";
import { toMediaPath } from "./media";

// Mirrors the API's Swagger docs (API_URL + /docs/), corrected where real responses
// differ from the Swagger file: `members` and `projects` are arrays, not
// strings. Objects are non-strict, so new backend fields never break a page.

const text = z.string().nullish().transform((value) => value ?? "");
const url = z.string().nullish().transform((value) => value || null);
// Uploaded files go through our /media route, never straight to the API host.
const media = z.string().nullish().transform((value) => toMediaPath(value));
// Fresh accounts have no position yet; anything unknown reads as "none".
const position = z.enum(POSITIONS).nullable().catch(null);

// A row that doesn't match (say, an enum value the frontend doesn't know yet)
// is logged and dropped, so one odd row never takes a whole page down.
export const listOf = <T extends z.ZodType>(item: T) =>
  z.array(z.unknown()).transform((rows) =>
    rows.flatMap((row): z.output<T>[] => {
      const parsed = item.safeParse(row);
      if (parsed.success) return [parsed.data];
      console.error("Dropped an API row that doesn't match the schema", parsed.error.issues);
      return [];
    }),
  );

export const createdSchema = z.object({ id: z.number() });

export const statsSchema = z.object({
  members_count: z.number(),
  projects_count: z.number(),
  companies_count: z.number(),
});

// Rows of project/team `members`: user ids only, names come from /members/.
export const membershipSchema = z.object({
  id: z.number(),
  user: z.number(),
  role: z.enum(MEMBERSHIP_ROLES),
});

export const projectListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  project_status: z.enum(PROJECT_STATUSES),
  category: z.string(),
  preview_image: media,
});

export const projectDetailSchema = projectListItemSchema.extend({
  description: text,
  demo_url: url,
  github_url: url,
  created_at: z.string(),
  members: listOf(membershipSchema),
});

export const memberListItemSchema = z.object({
  id: z.number(),
  first_name: text,
  last_name: text,
  position,
  avatar: media,
  status: z.enum(USER_STATUSES),
});

export const memberDetailSchema = memberListItemSchema.extend({
  bio: text,
  skills: text,
  github: url,
  linkedin: url,
  portfolio: url,
  resume: media,
  projects: listOf(projectListItemSchema),
});

export const teamListItemSchema = z.object({
  id: z.number(),
  team_name: z.string(),
  team_image: media,
});

export const teamDetailSchema = teamListItemSchema.extend({
  description: text,
  created_at: z.string(),
  members: listOf(membershipSchema),
});

export const clientRequestListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  title: z.string(),
  status: z.enum(REQUEST_STATUSES),
  created_at: z.string(),
});

export const clientRequestDetailSchema = clientRequestListItemSchema.extend({
  company: text,
  email: z.string(),
  phone: text,
  description: text,
  project_type: text,
  budget: z.number().nullish().transform((value) => value ?? null),
});

export const adminMemberListItemSchema = z.object({
  id: z.number(),
  login: z.string(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
});

export const adminMemberDetailSchema = adminMemberListItemSchema.extend({
  created_at: z.string(),
  first_name: text,
  last_name: text,
  avatar: media,
  bio: text,
  position,
  skills: text,
  github: url,
  linkedin: url,
  portfolio: url,
  resume: media,
});

// GET /personal-account/ — a numeric id also guards against the anonymous
// answer (200 with id: null).
export const accountSchema = z.object({
  id: z.number(),
  login: z.string(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
  first_name: text,
  last_name: text,
});

// The rest of GET /personal-account/: the cabinet's own profile.
export const myProfileSchema = accountSchema.extend({
  created_at: z.string(),
  avatar: media,
  bio: text,
  position,
  skills: text,
  github: url,
  linkedin: url,
  portfolio: url,
  resume: media,
});

// Résumé rows under /personal-account/. Dates are "YYYY-MM-DD"; an enum
// value the frontend doesn't know yet reads as "none" instead of dropping
// the row.
const optionalDate = z.string().nullish().transform((value) => value || null);

export const workSchema = z.object({
  id: z.number(),
  company: z.string(),
  position: z.string(),
  start_time: z.string(),
  end_time: optionalDate,
  working_format: z.enum(WORKING_FORMATS).nullable().catch(null),
  achievements: text,
});

export const educationSchema = z.object({
  id: z.number(),
  educational_institution: z.string(),
  specialization: z.string(),
  start_year: z.string(),
  end_year: optionalDate,
  studying_now: z.boolean().catch(false),
  responsibilities: text,
});

export const languageSchema = z.object({
  id: z.number(),
  languages: z.string(),
  // The API capitalises this one field.
  Level: z.enum(LANGUAGE_LEVELS).nullable().catch(null),
});

export const certificateSchema = z.object({
  id: z.number(),
  title: z.string(),
  organization: z.string(),
  given_date: z.string(),
  text,
  certificate_image: media,
});

export const tokensSchema = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1).optional(),
});

export type Stats = z.infer<typeof statsSchema>;
export type Membership = z.infer<typeof membershipSchema>;
export type ProjectListItem = z.infer<typeof projectListItemSchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;
export type MemberListItem = z.infer<typeof memberListItemSchema>;
export type MemberDetail = z.infer<typeof memberDetailSchema>;
export type TeamListItem = z.infer<typeof teamListItemSchema>;
export type TeamDetail = z.infer<typeof teamDetailSchema>;
export type ClientRequestListItem = z.infer<typeof clientRequestListItemSchema>;
export type ClientRequestDetail = z.infer<typeof clientRequestDetailSchema>;
export type AdminMemberListItem = z.infer<typeof adminMemberListItemSchema>;
export type AdminMemberDetail = z.infer<typeof adminMemberDetailSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Tokens = z.infer<typeof tokensSchema>;
export type MyProfile = z.infer<typeof myProfileSchema>;
export type Work = z.infer<typeof workSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Certificate = z.infer<typeof certificateSchema>;
