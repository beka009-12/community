import { describe, expect, it } from "vitest";
import { idleMembers, leadProfile, projectTeams, projectsWithoutLead, splitSkills, teamLeads, withPeople } from "./joins";
import type { MemberListItem, ProjectDetail } from "./schemas";

const person = (id: number, status: MemberListItem["status"] = "Active"): MemberListItem => ({
  id,
  first_name: `Имя${id}`,
  last_name: "Фамилия",
  position: "Frontend_Developer",
  avatar: null,
  status,
});

const project = (
  id: number,
  members: ProjectDetail["members"],
  project_status: ProjectDetail["project_status"] = "In_progress",
): ProjectDetail => ({
  id,
  name: `Проект ${id}`,
  project_status,
  category: "Web",
  preview_image: null,
  description: "",
  demo_url: null,
  github_url: null,
  created_at: "2026-09-28T00:00:00+06:00",
  members,
});

const roster = [person(1), person(2), person(3), person(4, "Inactive")];

describe("withPeople", () => {
  it("puts leads first and drops people missing from the roster", () => {
    const people = withPeople(
      [
        { id: 10, user: 2, role: "Developer" },
        { id: 11, user: 99, role: "Developer" },
        { id: 12, user: 1, role: "Team_Lead" },
      ],
      roster,
    );
    expect(people.map(({ member, role }) => [member.id, role])).toEqual([
      [1, "Team_Lead"],
      [2, "Developer"],
    ]);
  });
});

describe("attention lists", () => {
  const projects = [
    project(1, [{ id: 1, user: 1, role: "Team_Lead" }]),
    project(2, [{ id: 2, user: 2, role: "Developer" }]),
    project(3, [], "Completed"),
  ];

  it("lists unfinished projects without a lead", () => {
    expect(projectsWithoutLead(projects).map((item) => item.id)).toEqual([2]);
  });

  it("lists active members who are in no project", () => {
    expect(idleMembers(roster, projects).map((item) => item.id)).toEqual([3]);
  });

  it("builds project teams and skips empty ones", () => {
    expect(projectTeams(projects, roster).map((team) => team.project.id)).toEqual([1, 2]);
  });
});

describe("splitSkills", () => {
  it("splits on commas and newlines, trims and dedupes", () => {
    expect(splitSkills("React, TypeScript\nReact ,, Next.js ")).toEqual(["React", "TypeScript", "Next.js"]);
    expect(splitSkills("")).toEqual([]);
  });
});

describe("teamLeads", () => {
  it("lists a person who leads two projects once", () => {
    const leads = teamLeads(
      [
        project(1, [{ id: 1, user: 2, role: "Team_Lead" }]),
        project(2, [
          { id: 2, user: 2, role: "Team_Lead" },
          { id: 3, user: 1, role: "Team_Lead" },
        ]),
      ],
      roster,
    );
    expect(leads.map((member) => member.id)).toEqual([2, 1]);
  });

  it("skips developers", () => {
    const leads = teamLeads([project(1, [{ id: 1, user: 3, role: "Developer" }])], roster);
    expect(leads).toEqual([]);
  });

  it("skips a lead missing from the roster", () => {
    const leads = teamLeads([project(1, [{ id: 1, user: 99, role: "Team_Lead" }])], roster);
    expect(leads).toEqual([]);
  });
});

describe("leadProfile", () => {
  it("lists the projects the person is in, with their role and status", () => {
    const profile = leadProfile(person(2), "Ведёт два проекта.", [
      project(1, [{ id: 1, user: 2, role: "Team_Lead" }], "Completed"),
      project(2, [{ id: 2, user: 3, role: "Team_Lead" }]),
      project(3, [{ id: 3, user: 2, role: "Developer" }], "Paused"),
    ]);
    expect(profile).toEqual({
      member: person(2),
      bio: "Ведёт два проекта.",
      projects: [
        { id: 1, name: "Проект 1", status: "Completed", role: "Team_Lead" },
        { id: 3, name: "Проект 3", status: "Paused", role: "Developer" },
      ],
    });
  });
});
