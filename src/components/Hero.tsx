import Welcome from "./hero-sections/Welcome";
import Stats from "./hero-sections/Stats";
import ServicesPreview from "./hero-sections/ServicesPreview";
import Portfolio from "./hero-sections/Portfolio";
import Pillars from "./hero-sections/Pillars";
import CommunityPreview from "./hero-sections/CommunityPreview";
import Faq from "./hero-sections/Faq";
import FinalCta from "./hero-sections/FinalCta";

const Home = () => {
  return (
    <div>
      <Welcome />
      <Stats />
      <ServicesPreview />
      <Portfolio />
      <Pillars />
      <CommunityPreview />
      <Faq />
      <FinalCta />
    </div>
  );
};
export default Home;
