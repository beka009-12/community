import Welcome from "./hero-sections/Welcome";
import Showcase from "./hero-sections/Showcase";
import ServiceRows from "./hero-sections/ServiceRows";
import Process from "./hero-sections/Process";
import StatsStatement from "./hero-sections/StatsStatement";
import Doors from "./hero-sections/Doors";
import { getProjects } from "@/src/server/api/projects";
import { getStats } from "@/src/server/api/stats";
import { getTeamLeads } from "@/src/server/api/home";

// Keeps the company path to the services and «Заказать проект» short as
// the catalogue grows; «Все проекты» carries the rest.
const SHOWCASE_LIMIT = 6;

const Home = async () => {
  const [stats, projects, leads] = await Promise.all([
    getStats(),
    getProjects(),
    getTeamLeads(),
  ]);
  return (
    <div>
      <Welcome />
      {projects.length > 0 && <Showcase projects={projects.slice(0, SHOWCASE_LIMIT)} />}
      <StatsStatement stats={stats} />
      <ServiceRows />
      <Process leads={leads} />
      <Doors />
    </div>
  );
};
export default Home;
