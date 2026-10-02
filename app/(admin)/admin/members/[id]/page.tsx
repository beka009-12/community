import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import MemberForm from "@/src/components/admin/members/MemberForm";
import MemberSidebar from "@/src/components/admin/members/MemberSidebar";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { updateMemberAction } from "@/src/actions/admin/members";
import { requireAdmin } from "@/src/server/auth/dal";
import { getMember } from "@/src/server/repositories/members";

const Page = async ({ params, searchParams }: PageProps<"/admin/members/[id]">) => {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const member = await getMember(id);
  if (!member) notFound();

  const { user, profile } = member;
  const initial = {
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
  };

  return (
    <>
      <PageHeader
        title={`${profile.firstName} ${profile.lastName}`}
        back={{ href: "/admin/members", label: "Участники" }}
      />
      {created && (
        <p className={scss.notice} role="status">
          Участник создан. Передайте ему логин и пароль — пароль больше нигде не показывается.
        </p>
      )}
      <div className={scss.split}>
        <Panel title="Профиль">
          <MemberForm
            action={updateMemberAction.bind(null, id)}
            initial={initial}
            submitLabel="Сохранить"
          />
        </Panel>
        <MemberSidebar id={id} login={user.login} status={user.status} />
      </div>
    </>
  );
};

export default Page;
