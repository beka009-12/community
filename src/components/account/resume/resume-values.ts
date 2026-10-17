import type { Certificate, Education, Language, Work } from "@/src/server/api/schemas";

// What the inputs hold: strings, blank = none. A checkbox holds "on" or "".
export interface WorkValues {
  company: string;
  position: string;
  start_time: string;
  end_time: string;
  working_format: string;
  achievements: string;
}

export interface EducationValues {
  educational_institution: string;
  specialization: string;
  start_year: string;
  end_year: string;
  studying_now: string;
  responsibilities: string;
}

export interface LanguageValues {
  languages: string;
  Level: string;
}

export interface CertificateValues {
  title: string;
  organization: string;
  given_date: string;
  text: string;
}

export const EMPTY_WORK: WorkValues = {
  company: "",
  position: "",
  start_time: "",
  end_time: "",
  working_format: "",
  achievements: "",
};

export const EMPTY_EDUCATION: EducationValues = {
  educational_institution: "",
  specialization: "",
  start_year: "",
  end_year: "",
  studying_now: "",
  responsibilities: "",
};

export const EMPTY_LANGUAGE: LanguageValues = { languages: "", Level: "" };

export const EMPTY_CERTIFICATE: CertificateValues = { title: "", organization: "", given_date: "", text: "" };

export const workValues = (row: Work): WorkValues => ({
  company: row.company,
  position: row.position,
  start_time: row.start_time,
  end_time: row.end_time ?? "",
  working_format: row.working_format ?? "",
  achievements: row.achievements,
});

export const educationValues = (row: Education): EducationValues => ({
  educational_institution: row.educational_institution,
  specialization: row.specialization,
  start_year: row.start_year,
  end_year: row.end_year ?? "",
  studying_now: row.studying_now ? "on" : "",
  responsibilities: row.responsibilities,
});

export const languageValues = (row: Language): LanguageValues => ({
  languages: row.languages,
  Level: row.Level ?? "",
});

export const certificateValues = (row: Certificate): CertificateValues => ({
  title: row.title,
  organization: row.organization,
  given_date: row.given_date,
  text: row.text,
});
