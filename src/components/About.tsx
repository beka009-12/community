import Intro from "@/src/components/about-sections/Intro";
import Milestones from "@/src/components/about-sections/Milestones";
import Academy from "@/src/components/about-sections/Academy";
import Advantages from "@/src/components/about-sections/Advantages";
import Testimonials from "@/src/components/about-sections/Testimonials";
import Services from "@/src/components/about-sections/Services";
import RequestCta from "@/src/components/about-sections/RequestCta";
import scss from "./About.module.scss";

// Same section-per-file pattern as hero-sections/ and projects-sections/.
const About = () => (
  <div className={scss.page}>
    <Intro />
    <Milestones />
    <Academy />
    <Advantages />
    <Services />
    <Testimonials />
    <RequestCta />
  </div>
);

export default About;
