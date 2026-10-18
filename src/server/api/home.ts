import "server-only";
import { unstable_rethrow } from "next/navigation";
import { leadProfile, teamLeads, type LeadProfile } from "./joins";
import { getMember, getPublicRoster } from "./members";
import { getProjectsWithMembers } from "./projects";

// A secondary homepage section: when it can't load, the page shows without
// it instead of falling into the error boundary. The bio is only on the
// member detail, so each lead costs one more (cached) request.
export async function getTeamLeads(): Promise<LeadProfile[]> {
  try {
    const [roster, projects] = await Promise.all([getPublicRoster(), getProjectsWithMembers()]);
    const leads = teamLeads(projects, roster);
    const details = await Promise.all(leads.map((lead) => getMember(lead.id)));
    return leads.map((lead, index) => leadProfile(lead, details[index]?.bio ?? "", projects));
  } catch (error) {
    // Next signals dynamic rendering, redirects etc. by throwing: not a failure.
    unstable_rethrow(error);
    console.error("Failed to load team leads for the homepage", error);
    return [];
  }
}
