import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import TeamForm from "@/src/components/admin/teams/TeamForm";
import MembershipEditor from "@/src/components/admin/MembershipEditor";
import DeleteButton from "@/src/components/admin/ui/DeleteButton";
import { toCandidates, toMembershipRows } from "@/src/components/admin/membership-rows";
import { formatDate } from "@/src/components/admin/labels";
import {
  addTeamMemberAction,
  deleteTeamAction,
  removeTeamMemberAction,
  updateTeamAction,
} from "@/src/actions/admin/teams";
import { parseId } from "@/src/lib/route-id";
import { getMembers } from "@/src/server/api/members";
import { getTeam, getTeamMembers } from "@/src/server/api/teams";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async ({ params }: PageProps<"/admin/teams/[id]">) => {
  await requireAdmin();
  const id = parseId((await params).id);
  const team = id === null ? null : await getTeam(id);
  if (!team) notFound();

  const [memberships, roster] = await Promise.all([getTeamMembers(team.id), getMembers(true)]);

  return (
    <>
      <PageHeader
        title={team.team_name}
        back={{ href: "/admin/teams", label: "Команды" }}
        description={`Создана ${formatDate(team.created_at)}`}
      />
      <Panel title="Команда">
        <TeamForm
          action={updateTeamAction.bind(null, team.id)}
          initial={{ team_name: team.team_name, description: team.description }}
          submitLabel="Сохранить"
        />
      </Panel>
      <Panel title="Состав">
        <MembershipEditor
          rows={toMembershipRows(memberships, roster)}
          candidates={toCandidates(roster, memberships)}
          addAction={addTeamMemberAction.bind(null, team.id)}
          removeAction={removeTeamMemberAction.bind(null, team.id)}
        />
      </Panel>
      <Panel title="Удаление">
        <DeleteButton
          label="Удалить команду"
          confirmLabel="Да, удалить"
          action={deleteTeamAction.bind(null, team.id)}
        />
      </Panel>
    </>
  );
};

export default Page;
