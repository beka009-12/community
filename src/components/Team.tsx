import Intro from "@/src/components/team-sections/Intro";
import Roster from "@/src/components/team-sections/Roster";
import Teams from "@/src/components/team-sections/Teams";
import { getProjectTeams, getPublicMembers } from "@/src/server/queries/public";
import scss from "./Team.module.scss";

// Same section-per-file pattern as about-sections/ and hero-sections/.
const Team = async () => {
  const [members, teams] = await Promise.all([
    getPublicMembers(),
    getProjectTeams(),
  ]);
  return (
    <div className={scss.page}>
      <Intro />
      <Roster members={members} />
      <Teams teams={teams} />
    </div>
  );
};

export default Team;
