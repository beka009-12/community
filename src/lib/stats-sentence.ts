import { plural } from "./plural";

interface StatsCounts {
  members_count: number;
  projects_count: number;
  companies_count: number;
}

// Numbers are rendered as count-up figures, strings as plain text between them.
export type SentencePart = number | string;

// The homepage's numbers as one sentence; nouns and verbs agree with each count.
export function statsSentence({ members_count, projects_count, companies_count }: StatsCounts): SentencePart[] {
  if (members_count === 0) return [];

  const members = plural(members_count, "участник", "участника", "участников");
  if (projects_count === 0) return [members_count, ` ${members} в сообществе.`];

  const build = plural(members_count, "строит", "строят", "строят");
  const products = plural(projects_count, "собственный продукт", "собственных продукта", "собственных продуктов");
  const parts: SentencePart[] = [members_count, ` ${members} ${build} `, projects_count, ` ${products}.`];
  if (companies_count === 0) return parts;

  const companies = plural(companies_count, "компания", "компании", "компаний");
  const work = plural(companies_count, "работает", "работают", "работают");
  parts[parts.length - 1] += " ";
  return [...parts, companies_count, ` ${companies} уже ${work} с нами.`];
}
