import { describe, expect, it } from "vitest";
import {
  parseCertificate,
  parseEducation,
  parseLanguage,
  parsePasswordChange,
  parseProfile,
  parseWork,
} from "./account";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

describe("profile", () => {
  const profile = {
    first_name: "Анвар",
    last_name: "Касымов",
    position: "",
    bio: "",
    skills: "React",
    github: "",
    linkedin: "https://linkedin.com/in/anvar",
    portfolio: "",
  };

  it("turns blank links into null, leaves a blank position out and drops role and login", () => {
    const result = parseProfile(form({ ...profile, role: "Admin", login: "root" }));
    expect(result.success && result.data).toEqual({
      first_name: "Анвар",
      last_name: "Касымов",
      bio: "",
      skills: "React",
      github: null,
      linkedin: "https://linkedin.com/in/anvar",
      portfolio: null,
    });
  });

  it("rejects an unknown position and a broken link", () => {
    const result = parseProfile(form({ ...profile, position: "Chef", github: "github" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(Object.keys(result.fieldErrors).sort()).toEqual(["github", "position"]);
  });
});

describe("password", () => {
  it("sends only the password when both entries match", () => {
    expect(parsePasswordChange(form({ password: "new-secret-1", password_repeat: "new-secret-1" }))).toEqual({
      success: true,
      data: { password: "new-secret-1" },
    });
  });

  it("rejects a short password and a mismatched repeat", () => {
    const short = parsePasswordChange(form({ password: "123", password_repeat: "123" }));
    expect(!short.success && short.fieldErrors.password).toBe("Минимум 8 символов");
    const mismatch = parsePasswordChange(form({ password: "new-secret-1", password_repeat: "new-secret-2" }));
    expect(!mismatch.success && mismatch.fieldErrors.password_repeat).toBe("Пароли не совпадают");
  });
});

describe("work", () => {
  const work = {
    company: "Motion",
    position: "Frontend",
    start_time: "2024-01-15",
    end_time: "",
    working_format: "",
    achievements: "Сделал CRM.",
  };

  it("sends null for an open end and leaves a blank format out", () => {
    const result = parseWork(form(work));
    expect(result.success && result.data).toEqual({
      company: "Motion",
      position: "Frontend",
      start_time: "2024-01-15",
      end_time: null,
      achievements: "Сделал CRM.",
    });
  });

  it("rejects an end before the start", () => {
    const result = parseWork(form({ ...work, end_time: "2023-12-31" }));
    expect(!result.success && result.fieldErrors.end_time).toBe("Окончание не может быть раньше начала");
  });

  it("requires company, position, start and achievements and a known format", () => {
    const result = parseWork(
      form({ company: "", position: "", start_time: "", end_time: "", working_format: "weekends", achievements: "" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual([
        "achievements",
        "company",
        "position",
        "start_time",
        "working_format",
      ]);
    }
  });
});

describe("education", () => {
  const education = {
    educational_institution: "КГТУ",
    specialization: "Программная инженерия",
    start_year: "2019-09-01",
    end_year: "2023-06-30",
    responsibilities: "Учёба",
  };

  it("drops the end date while still studying", () => {
    const result = parseEducation(form({ ...education, studying_now: "on" }));
    expect(result.success && result.data).toMatchObject({ studying_now: true, end_year: null });
  });

  it("reads an unticked box as finished studies", () => {
    const result = parseEducation(form(education));
    expect(result.success && result.data).toMatchObject({ studying_now: false, end_year: "2023-06-30" });
  });

  it("rejects an end before the start", () => {
    const result = parseEducation(form({ ...education, end_year: "2018-06-30" }));
    expect(!result.success && result.fieldErrors.end_year).toBe("Окончание не может быть раньше начала");
  });
});

describe("language", () => {
  it("takes a language and a level from the list", () => {
    expect(parseLanguage(form({ languages: "Кыргызский", Level: "Родной язык" }))).toEqual({
      success: true,
      data: { languages: "Кыргызский", Level: "Родной язык" },
    });
  });

  it("rejects a blank or unknown level", () => {
    expect(parseLanguage(form({ languages: "Английский", Level: "" })).success).toBe(false);
    expect(parseLanguage(form({ languages: "Английский", Level: "B3" })).success).toBe(false);
  });
});

describe("certificate", () => {
  it("requires every field and a real date", () => {
    const result = parseCertificate(form({ title: "", organization: "", given_date: "01.03.2025", text: "" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["given_date", "organization", "text", "title"]);
    }
  });
});
