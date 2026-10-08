import { afterEach, describe, expect, it, vi } from "vitest";
import {
  accountSchema,
  memberDetailSchema,
  memberListItemSchema,
  projectDetailSchema,
  statsSchema,
} from "./schemas";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// Real API responses, captured 2026-10-08.
const MEMBER = {
  id: 2,
  first_name: "Нурлан",
  last_name: "Асанов",
  position: "Fullstack_Developer",
  avatar: null,
  status: "Active",
};
const PROJECT = {
  id: 1,
  name: "Motion LMS Platform",
  project_status: "Planned",
  category: "Education",
  preview_image: null,
};
const PROJECT_DETAIL = {
  ...PROJECT,
  description: "Платформа для онлайн-обучения студентов Motion с курсами и тестами.",
  demo_url: null,
  github_url: null,
  created_at: "2026-09-28T01:24:52.819445+06:00",
  members: [
    { id: 1, project: 1, user: 2, role: "Team_Lead" },
    { id: 2, project: 1, user: 4, role: "Developer" },
  ],
};
const MEMBER_DETAIL = {
  ...MEMBER,
  bio: "Нурлан Асанов — тимлид в Motion Community.",
  skills: "",
  github: null,
  linkedin: null,
  portfolio: null,
  resume: null,
  projects: [PROJECT],
};

describe("api schemas", () => {
  it("parse real responses", () => {
    expect(statsSchema.parse({ members_count: 12, projects_count: 5, companies_count: 4 })).toEqual({
      members_count: 12,
      projects_count: 5,
      companies_count: 4,
    });
    expect(memberListItemSchema.parse(MEMBER)).toEqual(MEMBER);
    expect(memberDetailSchema.parse(MEMBER_DETAIL).projects).toEqual([PROJECT]);
    expect(projectDetailSchema.parse(PROJECT_DETAIL).members).toEqual([
      { id: 1, user: 2, role: "Team_Lead" },
      { id: 2, user: 4, role: "Developer" },
    ]);
  });

  it("turns blank, unknown or missing positions into null", () => {
    expect(memberListItemSchema.parse({ ...MEMBER, position: "" }).position).toBeNull();
    expect(memberListItemSchema.parse({ ...MEMBER, position: "Chef" }).position).toBeNull();
    expect(memberListItemSchema.parse({ ...MEMBER, position: undefined }).position).toBeNull();
  });

  it("normalises empty URLs and missing text", () => {
    const parsed = memberDetailSchema.parse({ ...MEMBER_DETAIL, github: "", bio: null, skills: undefined });
    expect(parsed.github).toBeNull();
    expect(parsed.bio).toBe("");
    expect(parsed.skills).toBe("");
  });

  it("drops unknown keys", () => {
    expect(memberListItemSchema.parse({ ...MEMBER, rating: 5 })).not.toHaveProperty("rating");
  });

  it("still fails on a missing or mistyped required field", () => {
    expect(projectDetailSchema.safeParse({ ...PROJECT_DETAIL, name: undefined }).success).toBe(false);
    expect(projectDetailSchema.safeParse({ ...PROJECT_DETAIL, members: "[]" }).success).toBe(false);
  });

  it("routes API media through our own /media path", () => {
    vi.stubEnv("API_URL", "http://api.test/ru");
    const parsed = memberDetailSchema.parse({
      ...MEMBER_DETAIL,
      avatar: "http://api.test/media/avatars/a.png",
      resume: "http://api.test/media/cv/c.pdf",
      github: "https://github.com/anvar",
    });
    expect(parsed.avatar).toBe("/media/avatars/a.png");
    expect(parsed.resume).toBe("/media/cv/c.pdf");
    expect(parsed.github).toBe("https://github.com/anvar");
  });

  it("rejects the anonymous /personal-account/ answer", () => {
    expect(accountSchema.safeParse({ id: null, login: "", avatar: null }).success).toBe(false);
  });
});
