import Welcome from "./hero-sections/Welcome";
import Stats from "./hero-sections/Stats";
import ServicesPreview from "./hero-sections/ServicesPreview";
import Portfolio from "./hero-sections/Portfolio";
import Pillars from "./hero-sections/Pillars";
import CommunityPreview from "./hero-sections/CommunityPreview";
import { getPublicProjects } from "@/src/server/queries/public";
import Faq from "./hero-sections/Faq";
import FinalCta from "./hero-sections/FinalCta";

const Home = async () => {
  const featured = (await getPublicProjects()).filter(
    (project) => project.featured,
  );
  return (
    <div>
      <Welcome />
      <Stats />
      <ServicesPreview />
      {featured.length > 0 && <Portfolio projects={featured} />}
      <Pillars />
      <CommunityPreview />
      <Faq />
      <FinalCta />
    </div>
  );
};
export default Home;
