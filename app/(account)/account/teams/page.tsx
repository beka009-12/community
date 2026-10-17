import EmptyState from "@/src/components/admin/ui/EmptyState";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import PersonCell from "@/src/components/admin/PersonCell";
import { MEMBERSHIP_ROLE_LABELS } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { getMyProfile } from "@/src/server/api/account";
import { myTeams, withPeople } from "@/src/server/api/joins";
import { getMembers } from "@/src/server/api/members";
import { getTeamsWithMembers } from "@/src/server/api/teams";
import { requireRole } from "@/src/server/auth/dal";

const Page = async () => {
  await requireRole();
  const [me, teams, roster] = await Promise.all([getMyProfile(), getTeamsWithMembers(), getMembers()]);
  const mine = myTeams(teams, me.id);

  return (
    <>
      <PageHeader title="Мои команды" description="Команды, в которых вы состоите." />
      {mine.length === 0 ? (
        <EmptyState title="Вы пока не состоите ни в одной команде." />
      ) : (
        mine.map(({ team, role }) => (
          <Panel key={team.id} title={team.team_name}>
            <p style={{ marginBottom: 12 }}>
              <StatusBadge tone={role === "Team_Lead" ? "accent" : "neutral"}>
                Моя роль: {MEMBERSHIP_ROLE_LABELS[role]}
              </StatusBadge>
            </p>
            {team.description && <p className={ui.field__hint}>{team.description}</p>}
            <ul className={ui.membership__list}>
              {withPeople(team.members, roster).map((person) => (
                <li key={person.member.id} className={ui.membership__row}>
                  <PersonCell
                    avatar={person.member.avatar}
                    name={fullName(person.member)}
                    caption={MEMBERSHIP_ROLE_LABELS[person.role]}
                  />
                </li>
              ))}
            </ul>
          </Panel>
        ))
      )}
    </>
  );
};

export default Page;
