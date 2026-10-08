import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { MembershipRole } from "@/src/lib/api-enums";
import { authedDelete, authedGet, authedSend } from "./client";
import { nullIfNotFound } from "./errors";
import {
  createdSchema,
  membershipSchema,
  teamDetailSchema,
  teamListItemSchema,
  type Membership,
  type TeamDetail,
  type TeamListItem,
} from "./schemas";

export interface TeamWrite {
  team_name: string;
  description: string;
}

// /teams/ needs a token, so teams exist only inside the admin.
export const getTeams = cache(
  (): Promise<TeamListItem[]> => authedGet("/teams/", z.array(teamListItemSchema)),
);

export const getTeam = cache(
  (id: number): Promise<TeamDetail | null> => nullIfNotFound(authedGet(`/teams/${id}/`, teamDetailSchema)),
);

export const getTeamMembers = cache(
  (id: number): Promise<Membership[]> => authedGet(`/teams/${id}/members/`, z.array(membershipSchema)),
);

export async function createTeam(data: TeamWrite): Promise<number> {
  return (await authedSend("POST", "/teams/", data, createdSchema)).id;
}

export async function updateTeam(id: number, data: TeamWrite): Promise<void> {
  await authedSend("PATCH", `/teams/${id}/`, data, z.unknown());
}

export const deleteTeam = (id: number): Promise<void> => authedDelete(`/teams/${id}/`);

export async function addTeamMember(teamId: number, user: number, role: MembershipRole): Promise<void> {
  await authedSend("POST", `/teams/${teamId}/members/`, { user, role }, z.unknown());
}

export const removeTeamMember = (teamId: number, userId: number): Promise<void> =>
  authedDelete(`/teams/${teamId}/members/${userId}/`);
