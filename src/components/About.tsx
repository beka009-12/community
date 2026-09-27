import Intro from "@/src/components/about-sections/Intro";
import Academy from "@/src/components/about-sections/Academy";
import Founders from "@/src/components/about-sections/Founders";
import Advantages from "@/src/components/about-sections/Advantages";
import ServicesPreview from "@/src/components/hero-sections/ServicesPreview";
import RequestForm from "@/src/components/about-sections/RequestForm";

// Same section-per-file pattern as hero-sections/ and projects-sections/.
// Services is the one existing section reused as-is (not rebuilt) — same
// 4 categories, same component, imported straight from the homepage.
const About = () => (
  <div>
    <Intro />
    <Academy />
    <Founders />
    <Advantages />
    <ServicesPreview />
    <RequestForm />
  </div>
);

export default About;
