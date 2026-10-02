import Intro from "@/src/components/about-sections/Intro";
import Milestones from "@/src/components/about-sections/Milestones";
import Academy from "@/src/components/about-sections/Academy";
import Advantages from "@/src/components/about-sections/Advantages";
import Testimonials from "@/src/components/about-sections/Testimonials";
import ServicesPreview from "@/src/components/hero-sections/ServicesPreview";
import RequestCta from "@/src/components/about-sections/RequestCta";
import scss from "./About.module.scss";

// Same section-per-file pattern as hero-sections/ and projects-sections/.
// Services is the one existing section reused as-is (not rebuilt) — same
// 4 categories, same component, imported straight from the homepage, so
// it deliberately keeps its own styling.
const About = () => (
  <div className={scss.page}>
    <Intro />
    <Milestones />
    <Academy />
    <Advantages />
    <Testimonials />
    <ServicesPreview />
    <RequestCta />
  </div>
);

export default About;
