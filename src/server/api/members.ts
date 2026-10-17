import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { UserStatus } from "@/src/lib/api-enums";
import { authedGet, authedSend, publicGet } from "./client";
import { nullIfNotFound } from "./errors";
import {
  memberDetailSchema,
  memberListItemSchema,
  type MemberDetail,
  type MemberListItem,
  listOf,
} from "./schemas";

const listSchema = listOf(memberListItemSchema);

// `fresh`: the admin reads through its token, never from the shared cache.
export const getMembers = cache(
  (fresh = false): Promise<MemberListItem[]> =>
    fresh ? authedGet("/members/", listSchema) : publicGet("/members/", listSchema, "members"),
);

// The public site never shows inactive people.
export const getPublicRoster = cache(async (): Promise<MemberListItem[]> =>
  (await getMembers()).filter((member) => member.status === "Active"),
);

export const getMember = cache(
  (id: number, fresh = false): Promise<MemberDetail | null> =>
    nullIfNotFound(
      fresh
        ? authedGet(`/members/${id}/`, memberDetailSchema)
        : publicGet(`/members/${id}/`, memberDetailSchema, "members"),
    ),
);

// `status` is read-only in the admin schema; this endpoint accepts it.
export async function setMemberStatus(id: number, status: UserStatus): Promise<void> {
  await authedSend("PATCH", `/members/${id}/`, { status }, z.unknown());
}
