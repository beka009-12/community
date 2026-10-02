import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import TeamForm from "@/src/components/admin/teams/TeamForm";
import MembershipEditor from "@/src/components/admin/MembershipEditor";
import { toCandidates, toMembershipRows } from "@/src/components/admin/membership-rows";
import {
  removeTeamMemberAction,
  updateTeamAction,
  upsertTeamMemberAction,
} from "@/src/actions/admin/teams";
import { requireAdmin } from "@/src/server/auth/dal";
import { listMembers } from "@/src/server/repositories/members";
import { getTeam } from "@/src/server/repositories/teams";

const Page = async ({ params }: PageProps<"/admin/teams/[id]">) => {
  await requireAdmin();
  const { id } = await params;
  const [data, allMembers] = await Promise.all([getTeam(id), listMembers()]);
  if (!data) notFound();

  return (
    <>
      <PageHeader title={data.team.name} back={{ href: "/admin/teams", label: "Команды" }} />
      <Panel title="Команда">
        <TeamForm
          action={updateTeamAction.bind(null, id)}
          initial={{ name: data.team.name, description: data.team.description }}
          submitLabel="Сохранить"
        />
      </Panel>
      <Panel title="Состав">
        <MembershipEditor
          rows={toMembershipRows(data.members)}
          candidates={toCandidates(allMembers, data.members)}
          upsertAction={upsertTeamMemberAction.bind(null, id)}
          removeAction={removeTeamMemberAction.bind(null, id)}
        />
      </Panel>
    </>
  );
};

export default Page;
