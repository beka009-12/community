import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import MemberProfileView from "@/src/components/admin/members/MemberProfileView";
import MemberSidebar from "@/src/components/admin/members/MemberSidebar";
import EditProfileDialog from "@/src/components/admin/members/EditProfileDialog";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import {
  ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_TONE,
} from "@/src/components/admin/labels";
import { setMemberRoleAction, updateMemberProfileAction } from "@/src/actions/admin/members";
import { requireAdmin } from "@/src/server/auth/dal";
import { getMember } from "@/src/server/repositories/members";
import { lastAdminEdit } from "@/src/server/repositories/notifications";
import { listProjectsWithMembers } from "@/src/server/repositories/projects";

const Page = async ({ params, searchParams }: PageProps<"/admin/members/[id]">) => {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const [member, projects, edit] = await Promise.all([
    getMember(id),
    listProjectsWithMembers(),
    lastAdminEdit(id),
  ]);
  if (!member) notFound();

  const { user, profile } = member;
  const name = `${profile.firstName} ${profile.lastName}`;
  const memberProjects = projects.flatMap(({ project, members }) => {
    const row = members.find((item) => item.user.id === id);
    return row ? [{ id: project.id, name: project.name, role: row.membershipRole }] : [];
  });

  return (
    <>
      <PageHeader
        title={name}
        back={{ href: "/admin/members", label: "Участники" }}
        description={`${ROLE_LABELS[user.role]} · ${profile.roleTitle}`}
        meta={
          <StatusBadge tone={USER_STATUS_TONE[user.status]}>
            {USER_STATUS_LABELS[user.status]}
          </StatusBadge>
        }
        action={
          <EditProfileDialog
            memberName={name}
            action={updateMemberProfileAction.bind(null, id)}
            initial={{
              login: user.login,
              role: user.role,
              firstName: profile.firstName,
              lastName: profile.lastName,
              specializationId: profile.specializationId,
              roleTitle: profile.roleTitle,
              stack: profile.stack,
              bio: profile.bio,
              skills: profile.skills.join(", "),
              github: profile.github ?? "",
              linkedin: profile.linkedin ?? "",
              portfolio: profile.portfolio ?? "",
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
        <MemberProfileView login={user.login} profile={profile} projects={memberProjects} />
        <MemberSidebar
          id={id}
          login={user.login}
          status={user.status}
          role={user.role}
          roleAction={setMemberRoleAction.bind(null, id)}
          lastEdit={edit ? { at: edit.createdAt, fields: edit.fields } : null}
        />
      </div>
    </>
  );
};

export default Page;
