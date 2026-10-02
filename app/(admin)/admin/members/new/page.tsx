import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import MemberForm from "@/src/components/admin/members/MemberForm";
import { createMemberAction } from "@/src/actions/admin/members";
import { requireAdmin } from "@/src/server/auth/dal";

const EMPTY = {
  login: "",
  role: "DEVELOPER",
  firstName: "",
  lastName: "",
  specializationId: "frontend",
  roleTitle: "",
  stack: "",
  bio: "",
  skills: "",
  github: "",
  linkedin: "",
  portfolio: "",
};

const Page = async () => {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Новый участник" back={{ href: "/admin/members", label: "Участники" }} />
      <Panel>
        <MemberForm action={createMemberAction} initial={EMPTY} withPassword submitLabel="Создать участника" />
      </Panel>
    </>
  );
};

export default Page;
