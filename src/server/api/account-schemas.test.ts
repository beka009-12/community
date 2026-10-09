import { describe, expect, it } from "vitest";
import {
  certificateSchema,
  educationSchema,
  languageSchema,
  listOf,
  myProfileSchema,
  workSchema,
} from "./schemas";

describe("cabinet schemas", () => {
  it("reads the full own profile", () => {
    const profile = myProfileSchema.parse({
      id: 14,
      login: "adm",
      role: "Developer",
      status: "Active",
      created_at: "2026-09-28T01:47:34.634620+06:00",
      first_name: "",
      last_name: "",
      avatar: null,
      bio: "",
      position: "Backend_Developer",
      skills: "",
      github: null,
      linkedin: "",
      portfolio: null,
      resume: null,
      work_user: [],
    });
    expect(profile).toMatchObject({ id: 14, position: "Backend_Developer", linkedin: null, avatar: null });
  });

  it("keeps résumé rows with values the frontend doesn't know", () => {
    expect(
      workSchema.parse({
        id: 1,
        company: "Motion",
        position: "Frontend",
        start_time: "2024-01-15",
        end_time: null,
        working_format: "four_day_week",
        achievements: "Сделал CRM.",
      }),
    ).toMatchObject({ working_format: null, end_time: null });
    expect(languageSchema.parse({ id: 2, languages: "Английский", Level: "B3" })).toMatchObject({ Level: null });
  });

  it("reads education and certificates as the API sends them", () => {
    const rows = listOf(educationSchema).parse([
      {
        id: 3,
        educational_institution: "КГТУ",
        specialization: "Программная инженерия",
        start_year: "2019-09-01",
        end_year: "2023-06-30",
        studying_now: false,
        responsibilities: "Учёба",
      },
    ]);
    expect(rows).toEqual([expect.objectContaining({ id: 3, end_year: "2023-06-30", studying_now: false })]);
    expect(
      certificateSchema.parse({
        id: 4,
        title: "React",
        organization: "Meta",
        given_date: "2025-03-01",
        text: "Курс по React.",
        certificate_image: null,
      }),
    ).toMatchObject({ given_date: "2025-03-01", certificate_image: null });
  });
});
