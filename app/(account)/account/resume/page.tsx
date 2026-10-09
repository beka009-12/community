import PageHeader from "@/src/components/admin/ui/PageHeader";
import CertificateSection from "@/src/components/account/resume/CertificateSection";
import EducationSection from "@/src/components/account/resume/EducationSection";
import LanguageSection from "@/src/components/account/resume/LanguageSection";
import WorkSection from "@/src/components/account/resume/WorkSection";
import { newestFirst } from "@/src/lib/resume-format";
import {
  certificateResource,
  educationResource,
  languageResource,
  workResource,
} from "@/src/server/api/account";
import { requireRole } from "@/src/server/auth/dal";

const Page = async () => {
  await requireRole();
  const [work, education, languages, certificates] = await Promise.all([
    workResource.list(),
    educationResource.list(),
    languageResource.list(),
    certificateResource.list(),
  ]);

  return (
    <>
      <PageHeader
        title="Резюме"
        description="Резюме пока видно только вам: публичная страница участника его не показывает."
      />
      <WorkSection rows={newestFirst(work, (row) => row.start_time)} />
      <EducationSection rows={newestFirst(education, (row) => row.start_year)} />
      <LanguageSection rows={languages} />
      <CertificateSection rows={newestFirst(certificates, (row) => row.given_date)} />
    </>
  );
};

export default Page;
