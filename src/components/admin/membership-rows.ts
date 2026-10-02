import type { AdminMember } from "@/src/server/repositories/members";
import type { MemberWithRole } from "@/src/server/repositories/teams";
import type { Candidate, MembershipRow } from "./MembershipEditor";

const fullName = ({ profile }: AdminMember) => `${profile.firstName} ${profile.lastName}`;

export const toMembershipRows = (members: MemberWithRole[]): MembershipRow[] =>
  members.map((member) => ({
    userId: member.user.id,
    name: fullName(member),
    roleTitle: member.profile.roleTitle,
    active: member.user.status === "ACTIVE",
    membershipRole: member.membershipRole,
  }));

// Only active people who aren't in the list yet can be added.
export const toCandidates = (all: AdminMember[], current: MemberWithRole[]): Candidate[] =>
  all
    .filter(
      (member) =>
        member.user.status === "ACTIVE" &&
        !current.some((row) => row.user.id === member.user.id),
    )
    .map((member) => ({ userId: member.user.id, name: fullName(member) }));
