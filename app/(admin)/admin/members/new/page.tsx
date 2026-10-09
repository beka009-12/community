import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import MemberCreateForm from "@/src/components/admin/members/MemberCreateForm";
import MembersUnavailable from "@/src/components/admin/members/MembersUnavailable";
import { createMemberAction } from "@/src/actions/admin/members";
import { getAdminMembers, loadMembersSection } from "@/src/server/api/admin-members";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  const section = await loadMembersSection(getAdminMembers());
  return (
    <>
      <PageHeader title="Новый участник" back={{ href: "/admin/members", label: "Участники" }} />
      {section.blocked ? (
        <MembersUnavailable />
      ) : (
        <Panel>
          <MemberCreateForm action={createMemberAction} />
        </Panel>
      )}
    </>
  );
};

export default Page;
