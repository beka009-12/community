import { positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import type { MemberListItem, Membership } from "@/src/server/api/schemas";
import type { Candidate, MembershipRow } from "./MembershipEditor";

// Every membership stays visible, even for someone missing from the
// roster (e.g. deactivated), so the admin can still remove them.
export function toMembershipRows(memberships: Membership[], roster: MemberListItem[]): MembershipRow[] {
  const byId = new Map(roster.map((member) => [member.id, member]));
  return memberships
    .map((row) => {
      const member = byId.get(row.user);
      return {
        userId: row.user,
        name: member ? fullName(member) : `Участник #${row.user}`,
        caption: member ? (positionLabel(member.position) ?? "") : "нет в списке участников",
        role: row.role,
      };
    })
    .sort((a, b) => Number(b.role === "Team_Lead") - Number(a.role === "Team_Lead"));
}

// Only active people who aren't in the list yet can be added.
export const toCandidates = (roster: MemberListItem[], memberships: Membership[]): Candidate[] =>
  roster
    .filter((member) => member.status === "Active" && !memberships.some((row) => row.user === member.id))
    .map((member) => ({ userId: member.id, name: fullName(member) }));
