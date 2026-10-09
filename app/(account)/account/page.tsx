import Link from "next/link";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import MemberProfileForm from "@/src/components/admin/members/MemberProfileForm";
import { formatDate } from "@/src/components/admin/labels";
import PasswordForm from "@/src/components/account/PasswordForm";
import { changePasswordAction, updateProfileAction } from "@/src/actions/account/profile";
import { USER_ROLE_LABELS, USER_STATUS_LABELS, USER_STATUS_TONE, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { getMyProfile } from "@/src/server/api/account";
import { requireRole } from "@/src/server/auth/dal";

const Page = async () => {
  await requireRole();
  const me = await getMyProfile();
  // Admins and inactive members have no public page.
  const isPublic = me.role !== "Admin" && me.status === "Active";

  return (
    <>
      <PageHeader
        title={fullName(me, me.login)}
        description={[positionLabel(me.position), USER_ROLE_LABELS[me.role]].filter(Boolean).join(" · ")}
        action={
          isPublic ? (
            <Link href={`/team/${me.id}`} target="_blank" className={ui.smallButton}>
              Публичный профиль ↗
            </Link>
          ) : undefined
        }
      />
      <div className={ui.split}>
        <Panel title="Профиль">
          <MemberProfileForm
            action={updateProfileAction}
            showLogin={false}
            initial={{
              login: me.login,
              first_name: me.first_name,
              last_name: me.last_name,
              position: me.position ?? "",
              skills: me.skills,
              bio: me.bio,
              github: me.github ?? "",
              linkedin: me.linkedin ?? "",
              portfolio: me.portfolio ?? "",
            }}
          />
          <p className={ui.field__hint}>Фото и резюме в PDF пока добавляет администратор.</p>
        </Panel>
        <div>
          <Panel title="Доступ">
            <dl className={ui.meta}>
              <div>
                <dt>Логин</dt>
                <dd>{me.login}</dd>
              </div>
              <div>
                <dt>Роль</dt>
                <dd>{USER_ROLE_LABELS[me.role]}</dd>
              </div>
              <div>
                <dt>Статус</dt>
                <dd>
                  <StatusBadge tone={USER_STATUS_TONE[me.status]}>{USER_STATUS_LABELS[me.status]}</StatusBadge>
                </dd>
              </div>
              <div>
                <dt>Создан</dt>
                <dd>{formatDate(me.created_at)}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Сменить пароль">
            <PasswordForm action={changePasswordAction} />
          </Panel>
        </div>
      </div>
    </>
  );
};

export default Page;
