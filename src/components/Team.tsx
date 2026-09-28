import Intro from "@/src/components/team-sections/Intro";
import Roster from "@/src/components/team-sections/Roster";
import Teams from "@/src/components/team-sections/Teams";
import scss from "./Team.module.scss";

// Same section-per-file pattern as about-sections/ and hero-sections/.
const Team = () => (
  <div className={scss.page}>
    <Intro />
    <Roster />
    <Teams />
  </div>
);

export default Team;
