import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { Position, UserRole } from "@/src/lib/api-enums";
import { authedDelete, authedGet, authedSend } from "./client";
import { isApiError, nullIfNotFound } from "./errors";
import {
  adminMemberDetailSchema,
  adminMemberListItemSchema,
  createdSchema,
  listOf,
  type AdminMemberDetail,
  type AdminMemberListItem,
} from "./schemas";

export interface AdminMemberCreate {
  login: string;
  password: string;
  role: UserRole;
}

export interface AdminMemberPatch {
  login?: string;
  password?: string;
  role?: UserRole;
  first_name?: string;
  last_name?: string;
  bio?: string;
  position?: Position;
  skills?: string;
  github?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
}

export const getAdminMembers = cache(
  (): Promise<AdminMemberListItem[]> => authedGet("/admin/members/", listOf(adminMemberListItemSchema)),
);

export const getAdminMember = cache(
  (id: number): Promise<AdminMemberDetail | null> =>
    nullIfNotFound(authedGet(`/admin/members/${id}/`, adminMemberDetailSchema)),
);

export async function createAdminMember(data: AdminMemberCreate): Promise<number> {
  return (await authedSend("POST", "/admin/members/", data, createdSchema)).id;
}

export async function updateAdminMember(id: number, patch: AdminMemberPatch): Promise<void> {
  await authedSend("PATCH", `/admin/members/${id}/`, patch, z.unknown());
}

export const deleteAdminMember = (id: number): Promise<void> => authedDelete(`/admin/members/${id}/`);

export type MembersSection<T> = { blocked: false; data: T } | { blocked: true };

// /admin/members/ is shadowed by the Django admin today (302 —
// docs/backend-issues.md #1): the pages explain that instead of crashing.
export async function loadMembersSection<T>(load: Promise<T>): Promise<MembersSection<T>> {
  try {
    return { blocked: false, data: await load };
  } catch (error) {
    if (isApiError(error, "redirected")) return { blocked: true };
    throw error;
  }
}
