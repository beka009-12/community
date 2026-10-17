import Link from "next/link";
import AvatarStack from "@/src/components/admin/AvatarStack";
import RequestFunnel from "@/src/components/admin/overview/RequestFunnel";
import { ArrowRightIcon } from "@/src/components/admin/icons";
import scss from "@/src/components/admin/overview/Overview.module.scss";
import type { RequestStatus } from "@/src/lib/api-enums";
import { fullName } from "@/src/lib/people";
import { plural } from "@/src/lib/plural";
import { getClientRequests } from "@/src/server/api/client-requests";
import { idleMembers, projectsWithoutLead, withPeople } from "@/src/server/api/joins";
import { getMembers } from "@/src/server/api/members";
import { getProjectsWithMembers } from "@/src/server/api/projects";
import { requireAdmin } from "@/src/server/auth/dal";

interface AttentionItem {
  href: string;
  text: string;
  tone: "accent" | "warn" | "muted";
}

const Page = async () => {
  await requireAdmin();
  const [requests, projects, roster] = await Promise.all([
    getClientRequests(),
    getProjectsWithMembers(true),
    getMembers(true),
  ]);

  const counts = requests.reduce<Record<RequestStatus, number>>(
    (acc, request) => ({ ...acc, [request.status]: acc[request.status] + 1 }),
    { New: 0, Reviewing: 0 },
  );

  // "What needs doing now", not vanity totals.
  const attention: AttentionItem[] = [];
  if (counts.New > 0) {
    attention.push({
      href: "/admin/requests#status-New",
      text: `${counts.New} ${plural(counts.New, "новая заявка ждёт", "новые заявки ждут", "новых заявок ждут")} ответа`,
      tone: "accent",
    });
  }
  for (const project of projectsWithoutLead(projects)) {
    attention.push({
      href: `/admin/projects/${project.id}`,
      text: `${project.name} — нет тимлида`,
      tone: "warn",
    });
  }
  const idle = idleMembers(roster, projects).length;
  if (idle > 0) {
    attention.push({
      href: "/admin/members",
      text: `${idle} ${plural(idle, "участник", "участника", "участников")} без проектов`,
      tone: "muted",
    });
  }

  const inProgress = projects.filter((project) => project.project_status === "In_progress");
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
              {inProgress.map((project) => {
                const team = withPeople(project.members, roster);
                const lead = team.find((person) => person.role === "Team_Lead");
                return (
                  <li key={project.id} className={scss.projects__item}>
                    <Link href={`/admin/projects/${project.id}`} className={scss.projects__link}>
                      <span>
                        <span className={scss.projects__name}>{project.name}</span>
                        <span className={scss.projects__lead}>
                          {lead ? ` · ${fullName(lead.member)}` : " · без тимлида"}
                        </span>
                      </span>
                      <AvatarStack
                        people={team.map(({ member }) => ({
                          name: fullName(member),
                          avatar: member.avatar,
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
