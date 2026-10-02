import Intro from "@/src/components/contact-sections/Intro";
import RequestForm from "@/src/components/contact-sections/RequestForm";
import NextSteps from "@/src/components/contact-sections/NextSteps";
import scss from "./Contact.module.scss";

// «Заявка на проект» from the platform plan — the one public page where
// a client (no account) submits a ClientRequest.
const Contact = () => (
  <div className={scss.page}>
    <Intro />
    <div className={`container ${scss.layout}`}>
      <RequestForm />
      <NextSteps />
    </div>
  </div>
);

export default Contact;
