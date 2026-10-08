import { z } from "zod";
import {
  MEMBERSHIP_ROLES,
  POSITIONS,
  PROJECT_STATUSES,
  REQUEST_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from "@/src/lib/api-enums";

// Mirrors the API's Swagger docs (API_URL + /docs/), corrected where real responses
// differ from the Swagger file: `members` and `projects` are arrays, not
// strings. Objects are non-strict, so new backend fields never break a page.

const text = z.string().nullish().transform((value) => value ?? "");
const url = z.string().nullish().transform((value) => value || null);
// Fresh accounts have no position yet; anything unknown reads as "none".
const position = z.enum(POSITIONS).nullable().catch(null);

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
  preview_image: url,
});

export const projectDetailSchema = projectListItemSchema.extend({
  description: text,
  demo_url: url,
  github_url: url,
  created_at: z.string(),
  members: z.array(membershipSchema),
});

export const memberListItemSchema = z.object({
  id: z.number(),
  first_name: text,
  last_name: text,
  position,
  avatar: url,
  status: z.enum(USER_STATUSES),
});

export const memberDetailSchema = memberListItemSchema.extend({
  bio: text,
  skills: text,
  github: url,
  linkedin: url,
  portfolio: url,
  resume: url,
  projects: z.array(projectListItemSchema),
});

export const teamListItemSchema = z.object({
  id: z.number(),
  team_name: z.string(),
  team_image: url,
});

export const teamDetailSchema = teamListItemSchema.extend({
  description: text,
  created_at: z.string(),
  members: z.array(membershipSchema),
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
  avatar: url,
  bio: text,
  position,
  skills: text,
  github: url,
  linkedin: url,
  portfolio: url,
  resume: url,
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
