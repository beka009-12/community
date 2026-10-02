import "server-only";
import { randomUUID } from "node:crypto";
import { mutateDb, readDb } from "@/src/server/db/store";
import type { DbTeam, MembershipRole } from "@/src/server/db/types";
import { NotFoundError } from "./errors";
import { joinMember, type AdminMember } from "./members";

export interface MemberWithRole extends AdminMember {
  membershipRole: MembershipRole;
}

export interface TeamInput {
  name: string;
  description: string;
}

export async function listTeams(): Promise<Array<DbTeam & { memberCount: number }>> {
  const db = await readDb();
  return db.teams.map((team) => ({
    ...team,
    memberCount: db.teamMembers.filter((row) => row.teamId === team.id).length,
  }));
}

export async function getTeam(
  id: string,
): Promise<{ team: DbTeam; members: MemberWithRole[] } | null> {
  const db = await readDb();
  const team = db.teams.find((item) => item.id === id);
  if (!team) return null;
  const members = db.teamMembers
    .filter((row) => row.teamId === id)
    .flatMap((row) => {
      const member = joinMember(db, row.userId);
      return member ? [{ ...member, membershipRole: row.role }] : [];
    });
  return { team, members };
}

export async function createTeam(input: TeamInput): Promise<DbTeam> {
  return mutateDb((db) => {
    const team: DbTeam = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    db.teams.push(team);
    return team;
  });
}

export async function updateTeam(id: string, input: TeamInput): Promise<DbTeam> {
  return mutateDb((db) => {
    const team = db.teams.find((item) => item.id === id);
    if (!team) throw new NotFoundError("Команда не найдена");
    Object.assign(team, input);
    return team;
  });
}

export async function upsertTeamMember(
  teamId: string,
  userId: string,
  role: MembershipRole,
): Promise<void> {
  await mutateDb((db) => {
    if (!db.teams.some((team) => team.id === teamId)) {
      throw new NotFoundError("Команда не найдена");
    }
    if (!db.users.some((user) => user.id === userId)) {
      throw new NotFoundError("Участник не найден");
    }
    const row = db.teamMembers.find(
      (item) => item.teamId === teamId && item.userId === userId,
    );
    if (row) row.role = role;
    else db.teamMembers.push({ teamId, userId, role });
  });
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  await mutateDb((db) => {
    db.teamMembers = db.teamMembers.filter(
      (row) => !(row.teamId === teamId && row.userId === userId),
    );
  });
}
