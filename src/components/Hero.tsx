import Welcome from "./hero-sections/Welcome";
import Stats from "./hero-sections/Stats";
import ServicesPreview from "./hero-sections/ServicesPreview";
import Portfolio from "./hero-sections/Portfolio";
import Pillars from "./hero-sections/Pillars";
import CommunityPreview from "./hero-sections/CommunityPreview";
import { getProjects } from "@/src/server/api/projects";
import { getStats } from "@/src/server/api/stats";
import Faq from "./hero-sections/Faq";
import FinalCta from "./hero-sections/FinalCta";

const Home = async () => {
  const [stats, projects] = await Promise.all([getStats(), getProjects()]);
  return (
    <div>
      <Welcome />
      <Stats stats={stats} />
      <ServicesPreview />
      {projects.length > 0 && <Portfolio projects={projects} />}
      <Pillars />
      <CommunityPreview />
      <Faq />
      <FinalCta />
    </div>
  );
};
export default Home;
