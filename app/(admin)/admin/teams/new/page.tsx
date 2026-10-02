import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import TeamForm from "@/src/components/admin/teams/TeamForm";
import { createTeamAction } from "@/src/actions/admin/teams";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Новая команда" back={{ href: "/admin/teams", label: "Команды" }} />
      <Panel>
        <TeamForm action={createTeamAction} initial={{ name: "", description: "" }} submitLabel="Создать команду" />
      </Panel>
    </>
  );
};

export default Page;
