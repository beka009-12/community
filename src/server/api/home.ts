import "server-only";
import { unstable_rethrow } from "next/navigation";
import { teamLeads } from "./joins";
import { getPublicRoster } from "./members";
import { getProjectsWithMembers } from "./projects";
import type { MemberListItem } from "./schemas";

// A secondary homepage tile: when it can't load, the page shows without it
// instead of falling into the error boundary.
export async function getTeamLeads(): Promise<MemberListItem[]> {
  try {
    const [roster, projects] = await Promise.all([getPublicRoster(), getProjectsWithMembers()]);
    return teamLeads(projects, roster);
  } catch (error) {
    // Next signals dynamic rendering, redirects etc. by throwing: not a failure.
    unstable_rethrow(error);
    console.error("Failed to load team leads for the homepage", error);
    return [];
  }
}
