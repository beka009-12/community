import Link from "next/link";
import AvatarStack from "@/src/components/admin/AvatarStack";
import RequestFunnel from "@/src/components/admin/overview/RequestFunnel";
import { ArrowRightIcon } from "@/src/components/admin/icons";
import scss from "@/src/components/admin/overview/Overview.module.scss";
import { requireAdmin } from "@/src/server/auth/dal";
import { listMembers } from "@/src/server/repositories/members";
import {
  countProjectsByMember,
  listProjectsWithMembers,
} from "@/src/server/repositories/projects";
import { listClientRequests } from "@/src/server/repositories/requests";
import type { RequestStatus } from "@/src/server/db/types";

interface AttentionItem {
  href: string;
  text: string;
  tone: "accent" | "warn" | "muted";
}

const plural = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

const Page = async () => {
  await requireAdmin();
  const [requests, projects, members, projectCounts] = await Promise.all([
    listClientRequests(),
    listProjectsWithMembers(),
    listMembers(),
    countProjectsByMember(),
  ]);

  const counts = requests.reduce<Record<RequestStatus, number>>(
    (acc, request) => ({ ...acc, [request.status]: acc[request.status] + 1 }),
    { NEW: 0, REVIEWING: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, REJECTED: 0 },
  );

  // "What needs doing now", not vanity totals.
  const attention: AttentionItem[] = [];
  if (counts.NEW > 0) {
    attention.push({
      href: "/admin/requests#status-NEW",
      text: `${counts.NEW} ${plural(counts.NEW, "новая заявка ждёт", "новые заявки ждут", "новых заявок ждут")} ответа`,
      tone: "accent",
    });
  }
  projects
    .filter(
      ({ project, members: team }) =>
        project.status !== "COMPLETED" &&
        !team.some((member) => member.membershipRole === "TEAM_LEAD"),
    )
    .forEach(({ project }) =>
      attention.push({
        href: `/admin/projects/${project.id}`,
        text: `${project.name} — нет тимлида`,
        tone: "warn",
      }),
    );
  const idle = members.filter(
    (member) => member.user.status === "ACTIVE" && !projectCounts[member.user.id],
  ).length;
  if (idle > 0) {
    attention.push({
      href: "/admin/members",
      text: `${idle} ${plural(idle, "участник", "участника", "участников")} без проектов`,
      tone: "muted",
    });
  }

  const inProgress = projects.filter(({ project }) => project.status === "IN_PROGRESS");
  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <header className={scss.intro}>
        <h1 className={scss.intro__title}>Обзор</h1>
        <p className={scss.intro__date}>{today}</p>
      </header>

      <section className={scss.block} aria-labelledby="funnel-title">
        <div className={scss.block__head}>
          <h2 id="funnel-title" className={scss.block__title}>
            Путь заявок
          </h2>
          <Link href="/admin/requests" className={scss.block__link}>
            Все заявки <ArrowRightIcon />
          </Link>
        </div>
        <RequestFunnel counts={counts} />
      </section>

      <div className={scss.grid}>
        <section className={scss.block} aria-labelledby="attention-title">
          <div className={scss.block__head}>
            <h2 id="attention-title" className={scss.block__title}>
              Требует внимания
            </h2>
          </div>
          {attention.length === 0 ? (
            <p className={scss.allClear}>Всё разобрано — новых задач нет.</p>
          ) : (
            <ul className={scss.attention}>
              {attention.map((item) => (
                <li key={item.text} className={scss.attention__item}>
                  <Link href={item.href} className={scss.attention__link}>
                    <span
                      className={`${scss.attention__dot} ${item.tone !== "accent" ? scss[`attention__dot--${item.tone}`] : ""}`}
                      aria-hidden="true"
                    />
                    {item.text}
                    <span className={scss.attention__arrow}>
                      <ArrowRightIcon />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={scss.block} aria-labelledby="active-title">
          <div className={scss.block__head}>
            <h2 id="active-title" className={scss.block__title}>
              Проекты в работе
            </h2>
            <Link href="/admin/projects" className={scss.block__link}>
              Все проекты <ArrowRightIcon />
            </Link>
          </div>
          {inProgress.length === 0 ? (
            <p className={scss.allClear}>Сейчас ничего не в работе.</p>
          ) : (
            <ul className={scss.projects}>
              {inProgress.map(({ project, members: team }) => {
                const lead = team.find((member) => member.membershipRole === "TEAM_LEAD");
                return (
                  <li key={project.id} className={scss.projects__item}>
                    <Link href={`/admin/projects/${project.id}`} className={scss.projects__link}>
                      <span>
                        <span className={scss.projects__name}>{project.name}</span>
                        <span className={scss.projects__lead}>
                          {lead
                            ? ` · ${lead.profile.firstName} ${lead.profile.lastName}`
                            : " · без тимлида"}
                        </span>
                      </span>
                      <AvatarStack
                        people={team.map((member) => ({
                          id: member.user.id,
                          name: `${member.profile.firstName} ${member.profile.lastName}`,
                          photo: member.profile.photo,
                        }))}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
};

export default Page;
