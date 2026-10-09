import { afterEach, describe, expect, it, vi } from "vitest";
import { authedDelete, authedGet, authedSend } from "./client";
import {
  certificateResource,
  changeMyPassword,
  educationResource,
  getMyProfile,
  languageResource,
  updateMyProfile,
  workResource,
  type ResumeResource,
} from "./account";

vi.mock("./client", () => ({ authedGet: vi.fn(), authedSend: vi.fn(), authedDelete: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

const exercise = async <Write>(resource: ResumeResource<unknown, Write>, sample: Write, path: string) => {
  vi.mocked(authedGet).mockResolvedValue([]);
  vi.mocked(authedSend).mockResolvedValue(undefined);
  vi.mocked(authedDelete).mockResolvedValue(undefined);
  await resource.list();
  await resource.create(sample);
  await resource.update(5, sample);
  await resource.remove(5);
  expect(authedGet).toHaveBeenCalledWith(path, expect.anything());
  expect(authedSend).toHaveBeenCalledWith("POST", path, sample, expect.anything());
  expect(authedSend).toHaveBeenCalledWith("PATCH", `${path}5/`, sample, expect.anything());
  expect(authedDelete).toHaveBeenCalledWith(`${path}5/`);
};

describe("account api", () => {
  it("reads the own profile", async () => {
    vi.mocked(authedGet).mockResolvedValue({ id: 1 });
    await getMyProfile();
    expect(authedGet).toHaveBeenCalledWith("/personal-account/", expect.anything());
  });

  it("patches only the profile fields", async () => {
    vi.mocked(authedSend).mockResolvedValue(undefined);
    const patch = {
      first_name: "Анвар",
      last_name: "Касымов",
      bio: "",
      skills: "React",
      github: null,
      linkedin: null,
      portfolio: null,
    };
    await updateMyProfile(patch);
    expect(authedSend).toHaveBeenCalledWith("PATCH", "/personal-account/", patch, expect.anything());
  });

  it("changes the password with a PATCH of the password alone", async () => {
    vi.mocked(authedSend).mockResolvedValue(undefined);
    await changeMyPassword("new-secret-1");
    expect(authedSend).toHaveBeenCalledWith(
      "PATCH",
      "/personal-account/",
      { password: "new-secret-1" },
      expect.anything(),
    );
  });

  it("work rows use /personal-account/work/", () =>
    exercise(
      workResource,
      {
        company: "Motion",
        position: "Frontend",
        start_time: "2024-01-15",
        end_time: null,
        achievements: "Сделал CRM.",
      },
      "/personal-account/work/",
    ));

  it("education rows use /personal-account/education/", () =>
    exercise(
      educationResource,
      {
        educational_institution: "КГТУ",
        specialization: "Программная инженерия",
        start_year: "2019-09-01",
        end_year: null,
        studying_now: true,
        responsibilities: "Учёба",
      },
      "/personal-account/education/",
    ));

  it("languages use /personal-account/languages/", () =>
    exercise(languageResource, { languages: "Английский", Level: "B2" }, "/personal-account/languages/"));

  it("certificates use /personal-account/certificates/", () =>
    exercise(
      certificateResource,
      { title: "React", organization: "Meta", given_date: "2025-03-01", text: "Курс по React." },
      "/personal-account/certificates/",
    ));
});
