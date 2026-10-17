import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import MemberProfileView from "@/src/components/admin/members/MemberProfileView";
import MemberSidebar from "@/src/components/admin/members/MemberSidebar";
import EditProfileDialog from "@/src/components/admin/members/EditProfileDialog";
import MembersUnavailable from "@/src/components/admin/members/MembersUnavailable";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { setMemberRoleAction, updateMemberProfileAction } from "@/src/actions/admin/members";
import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_TONE,
  positionLabel,
} from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { parseId } from "@/src/lib/route-id";
import { getAdminMember, loadMembersSection } from "@/src/server/api/admin-members";
import { getMember } from "@/src/server/api/members";
import { requireAdmin } from "@/src/server/auth/dal";

const BACK = { href: "/admin/members", label: "Участники" };

const Page = async ({ params, searchParams }: PageProps<"/admin/members/[id]">) => {
  await requireAdmin();
  const id = parseId((await params).id);
  if (id === null) notFound();
  const { created } = await searchParams;

  // The public profile carries the member's projects; a 404 there just
  // means no public profile.
  const [section, publicProfile] = await Promise.all([
    loadMembersSection(getAdminMember(id)),
    getMember(id, true),
  ]);
  if (section.blocked) {
    return (
      <>
        <PageHeader title="Участник" back={BACK} />
        <MembersUnavailable />
      </>
    );
  }
  const member = section.data;
  if (!member) notFound();

  const name = fullName(member, member.login);

  return (
    <>
      <PageHeader
        title={name}
        back={BACK}
        description={[USER_ROLE_LABELS[member.role], positionLabel(member.position)].filter(Boolean).join(" · ")}
        meta={
          <StatusBadge tone={USER_STATUS_TONE[member.status]}>
            {USER_STATUS_LABELS[member.status]}
          </StatusBadge>
        }
        action={
          <EditProfileDialog
            memberName={name}
            action={updateMemberProfileAction.bind(null, member.id)}
            initial={{
              login: member.login,
              first_name: member.first_name,
              last_name: member.last_name,
              position: member.position ?? "",
              skills: member.skills,
              bio: member.bio,
              github: member.github ?? "",
              linkedin: member.linkedin ?? "",
              portfolio: member.portfolio ?? "",
            }}
          />
        }
      />
      {created && (
        <p className={scss.notice} role="status">
          Участник создан. Передайте ему логин и пароль — пароль больше нигде не показывается.
        </p>
      )}
      <div className={scss.split}>
        <MemberProfileView member={member} projects={publicProfile?.projects ?? []} />
        <MemberSidebar
          id={member.id}
          login={member.login}
          status={member.status}
          role={member.role}
          createdAt={member.created_at}
          roleAction={setMemberRoleAction.bind(null, member.id)}
        />
      </div>
    </>
  );
};

export default Page;
