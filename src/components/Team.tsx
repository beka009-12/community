import Intro from "@/src/components/team-sections/Intro";
import Roster from "@/src/components/team-sections/Roster";
import Teams from "@/src/components/team-sections/Teams";
import { projectTeams } from "@/src/server/api/joins";
import { getPublicRoster } from "@/src/server/api/members";
import { getProjectsWithMembers } from "@/src/server/api/projects";
import scss from "./Team.module.scss";

// Same section-per-file pattern as about-sections/ and hero-sections/.
// /teams/ needs a token, so «Команды по проектам» is built from project
// memberships instead.
const Team = async () => {
  const [members, projects] = await Promise.all([getPublicRoster(), getProjectsWithMembers()]);
  const teams = projectTeams(projects, members);
  return (
    <div className={scss.page}>
      <Intro />
      <Roster members={members} />
      {teams.length > 0 && <Teams teams={teams} />}
    </div>
  );
};

export default Team;
