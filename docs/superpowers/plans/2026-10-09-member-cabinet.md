# Member Cabinet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/account` placeholder with a cabinet where a signed-in member edits their profile and résumé and sees their projects and teams, all through the Django API.

**Architecture:**
- Same server-first stack as the admin: Server Components read through `src/server/api/*`, Server Actions validate with zod and write through the API, client components only for forms and dialogs.
- `src/server/api/account.ts` holds the profile calls and one typed factory for the four résumé resources.
- The admin sidebar becomes a shared `DashboardShell`/`DashboardNav`; the admin and the cabinet pass their own links.

**Tech Stack:** Next.js 16.3 (App Router, Server Actions, `updateTag`, `revalidatePath`), React 19.2 (`useActionState`), TypeScript strict, zod 4, vitest, SCSS modules, bun.

**Spec:** `docs/superpowers/specs/2026-10-09-member-cabinet-design.md` (builds on `docs/superpowers/specs/2026-10-08-api-integration-design.md`).

## Global Constraints

**API**
- API base comes from `API_URL` (`.env`, server-only). The server address never appears in committed files.
- Calls with a token use the existing `authedGet` / `authedSend` / `authedDelete` (`cache: "no-store"`, 401 → `/login`). Public data keeps `publicGet`.
- Never send `role`, `login` or `status` from the cabinet. Never call `DELETE /personal-account/`.

**Data shapes**
- Form input names equal API field names (`start_time`, `studying_now`, `Level`, `password`…), so DRF field errors map 1:1.
- Enum values exactly as the API sends them, imported from `src/lib/api-enums.ts`.
- Dates are `YYYY-MM-DD` strings (`<input type="date">`), parsed by hand, never through `new Date()` (time zones shift them).

**Caching**
- Cabinet actions call `revalidatePath("/account", "layout")` on success. Profile changes also call `updateTag("members")`.

**UI**
- The UI is a demo for checking logic: build from the admin UI kit (`Panel`, `Field`, `FormActions`, `PageHeader`, `ConfirmButton`, `EmptyState`, `StatusBadge`, `PersonCell`, `ProjectCard`, the `EditProfileDialog` styles). No bespoke design or motion work.
- User-facing copy in Russian.

**Code style**
- No `any`, no `@ts-ignore`. `async/await` only. Interfaces or types for every props object, state and API shape.
- Naming: components `PascalCase.tsx`, every other module `kebab-case.ts`.
- `redirect()`, `notFound()` and `unstable_rethrow` follow the Next rules; error mappers call `unstable_rethrow` first.
- A `"use client"` module exports only components and types. Plain values the server needs (empty form values, row → form mappers) live in a module without the directive.

**Commits**
- English Conventional Commits, each ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Before each commit: `git diff --cached` must not contain the API host from `.env`.

**Type checks**
- `bunx next typegen && bunx tsc --noEmit` after every task.

## Review Focus

1. **«Учусь сейчас» ticked while an end date is still filled in.** The saved row has `end_year: null`. (Task 4 test «drops the end date while still studying»)
2. **End date before start date** in work or education. Field error under the end date, no API call. (Task 4 tests «rejects an end before the start»)
3. **A résumé row with a `working_format` or `Level` the frontend doesn't know.** The row still shows (value reads as none) instead of disappearing. (Task 2 test «keeps résumé rows with values the frontend doesn't know»)
4. **Extra `role` / `login` fields posted to the profile action** (a tampered form). They never reach the API. (Task 6 test «saves the profile without role or login»)
5. **A member in no project or team, or an Admin without a public profile.** Empty states, not a 404 or an error page. (Task 5 test «returns nothing for someone in no project or team»; Task 8 hides «Публичный профиль» for admins)

---

## File Structure

```
src/actions/form-state.ts, src/actions/handle-error.ts    moved from actions/admin/ (shared)
src/lib/api-enums.ts                 + WORKING_FORMATS, LANGUAGE_LEVELS
src/lib/api-labels.ts                + WORKING_FORMAT_LABELS
src/lib/resume-format.ts             date and period labels, newest-first sort
src/server/api/schemas.ts            + myProfileSchema, workSchema, educationSchema, languageSchema, certificateSchema
src/server/api/account.ts            profile, password, résumé resources
src/server/api/teams.ts              + getTeamsWithMembers
src/server/api/joins.ts              + myProjects, myTeams
src/server/validation/account.ts     profile, password and résumé form schemas
src/actions/account/profile.ts       updateProfileAction, changePasswordAction
src/actions/account/resume.ts        create/update/delete for each résumé resource
src/components/dashboard/            DashboardShell, DashboardNav (+ styles moved from admin)
src/components/account/              PasswordForm, ResumeItemDialog, use-resume-form, resume/*
app/(account)/account/{layout,page,resume/page,projects/page,teams/page}.tsx, app/(account)/error.tsx
```

---

### Task 1: Shared form helpers and the «Проверьте поля формы» message

**Files:**
- Move: `src/actions/admin/form-state.ts` → `src/actions/form-state.ts`, `src/actions/admin/handle-error.ts` → `src/actions/handle-error.ts`, `src/actions/admin/handle-error.test.ts` → `src/actions/handle-error.test.ts`
- Modify: every importer (admin actions and components), `src/actions/handle-error.ts`, `src/actions/handle-error.test.ts`

**Interfaces:**
- Produces: `@/src/actions/form-state` (`FormState`, `ActionResult`, `SAVE_FAILED`, `echoValues`) and `@/src/actions/handle-error` (`toFormError`, `toActionError`), same signatures as today. `toFormError` now always sets `error` for validation errors.

- [ ] **Step 1: Move the files and fix the imports**

```bash
git mv src/actions/admin/form-state.ts src/actions/form-state.ts
git mv src/actions/admin/handle-error.ts src/actions/handle-error.ts
git mv src/actions/admin/handle-error.test.ts src/actions/handle-error.test.ts
grep -rl -E '@/src/actions/admin/(form-state|handle-error)' app src | xargs sed -i '' -E 's#@/src/actions/admin/(form-state|handle-error)#@/src/actions/\1#g'
sed -i '' -E 's#from "\./(form-state|handle-error)"#from "../\1"#' src/actions/admin/members.ts src/actions/admin/projects.ts src/actions/admin/requests.ts src/actions/admin/teams.ts
grep -rn -E 'actions/admin/(form-state|handle-error)|"\./(form-state|handle-error)"' app src
```
Expected: the last grep prints only `src/actions/handle-error.ts` (its `./form-state` import, now a sibling) and `src/actions/handle-error.test.ts` (`./handle-error`).

Run: `bun run test && bunx next typegen && bunx tsc --noEmit`
Expected: PASS, exit 0.

- [ ] **Step 2: Commit the move**

```bash
git add -A src/actions src/components app
git commit -m "refactor: share form state and error mapping across actions" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Write the failing test**

In `src/actions/handle-error.test.ts`, replace the first test with:
```ts
  it("maps DRF field errors onto the form, keeps the values and says why", () => {
    const state = toFormError(
      new ApiError("validation", 400, "", { team_name: "Такая команда уже есть." }),
      { team_name: "A" },
    );
    expect(state).toEqual({
      fieldErrors: { team_name: "Такая команда уже есть." },
      error: "Проверьте поля формы.",
      values: { team_name: "A" },
    });
  });
```

- [ ] **Step 4: Run it to see it fail**

Run: `bun run test src/actions/handle-error.test.ts`
Expected: FAIL — `error` is `undefined`.

- [ ] **Step 5: Implement**

In `src/actions/handle-error.ts`, replace the validation branch of `toFormError`:
```ts
  // A field error may name a field the form doesn't have, so the form
  // always gets a message too.
  if (isApiError(error, "validation")) {
    return { fieldErrors: error.fieldErrors, error: apiErrorMessage(error), values };
  }
```
(`apiErrorMessage` returns the backend's `detail` when there is one, otherwise «Проверьте поля формы.».)

- [ ] **Step 6: Run the tests**

Run: `bun run test && bunx tsc --noEmit`
Expected: PASS, exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/actions/handle-error.ts src/actions/handle-error.test.ts
git commit -m "fix: always explain rejected form fields" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Cabinet enums, labels and schemas

**Files:**
- Modify: `src/lib/api-enums.ts`, `src/lib/api-labels.ts`, `src/server/api/schemas.ts`
- Test: `src/server/api/account-schemas.test.ts`

**Interfaces:**
- Produces:
  - `WORKING_FORMATS` / `WorkingFormat`, `LANGUAGE_LEVELS` / `LanguageLevel`, `WORKING_FORMAT_LABELS: Record<WorkingFormat, string>`.
  - `myProfileSchema` / `MyProfile` (= `Account` + `created_at`, `avatar`, `bio`, `position`, `skills`, `github`, `linkedin`, `portfolio`, `resume`).
  - `workSchema` / `Work`, `educationSchema` / `Education`, `languageSchema` / `Language`, `certificateSchema` / `Certificate` (fields in the spec table; unknown enums read as `null`).

- [ ] **Step 1: Write the failing test**

`src/server/api/account-schemas.test.ts`:
```ts
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
```

- [ ] **Step 2: Run it to see it fail**

Run: `bun run test src/server/api/account-schemas.test.ts`
Expected: FAIL — `myProfileSchema` (and the others) are not exported.

- [ ] **Step 3: Implement**

Append to `src/lib/api-enums.ts`:
```ts
export const WORKING_FORMATS = [
  "office",
  "remote",
  "hybrid",
  "freelance",
  "part_time",
  "full_time",
  "contract",
  "internship",
  "flexible",
] as const;
export type WorkingFormat = (typeof WORKING_FORMATS)[number];

export const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Родной язык"] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];
```

In `src/lib/api-labels.ts`, add `WorkingFormat` to the type import from `./api-enums` and append:
```ts
export const WORKING_FORMAT_LABELS: Record<WorkingFormat, string> = {
  office: "Офис",
  remote: "Удалённо",
  hybrid: "Гибрид",
  freelance: "Фриланс",
  part_time: "Частичная занятость",
  full_time: "Полная занятость",
  contract: "Контракт",
  internship: "Стажировка",
  flexible: "Гибкий график",
};
```

In `src/server/api/schemas.ts`:
- add `LANGUAGE_LEVELS` and `WORKING_FORMATS` to the `@/src/lib/api-enums` import;
- after `accountSchema`, add:
```ts
// The rest of GET /personal-account/: the cabinet's own profile.
export const myProfileSchema = accountSchema.extend({
  created_at: z.string(),
  avatar: media,
  bio: text,
  position,
  skills: text,
  github: url,
  linkedin: url,
  portfolio: url,
  resume: media,
});

// Résumé rows under /personal-account/. Dates are "YYYY-MM-DD"; an enum
// value the frontend doesn't know yet reads as "none" instead of dropping
// the row.
const optionalDate = z.string().nullish().transform((value) => value || null);

export const workSchema = z.object({
  id: z.number(),
  company: z.string(),
  position: z.string(),
  start_time: z.string(),
  end_time: optionalDate,
  working_format: z.enum(WORKING_FORMATS).nullable().catch(null),
  achievements: text,
});

export const educationSchema = z.object({
  id: z.number(),
  educational_institution: z.string(),
  specialization: z.string(),
  start_year: z.string(),
  end_year: optionalDate,
  studying_now: z.boolean().catch(false),
  responsibilities: text,
});

export const languageSchema = z.object({
  id: z.number(),
  languages: z.string(),
  // The API capitalises this one field.
  Level: z.enum(LANGUAGE_LEVELS).nullable().catch(null),
});

export const certificateSchema = z.object({
  id: z.number(),
  title: z.string(),
  organization: z.string(),
  given_date: z.string(),
  text,
  certificate_image: media,
});
```
- at the end of the type exports, add:
```ts
export type MyProfile = z.infer<typeof myProfileSchema>;
export type Work = z.infer<typeof workSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Certificate = z.infer<typeof certificateSchema>;
```

- [ ] **Step 4: Run the tests and the type check**

Run: `bun run test src/server/api && bunx tsc --noEmit`
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api-enums.ts src/lib/api-labels.ts src/server/api/schemas.ts src/server/api/account-schemas.test.ts
git commit -m "feat: add cabinet profile and résumé schemas" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Cabinet API module and teams with members

**Files:**
- Rewrite: `src/server/api/account.ts`
- Modify: `src/server/api/teams.ts`
- Test: `src/server/api/account.test.ts`, `src/server/api/teams.test.ts`

**Interfaces:**
- Consumes: Task 2 schemas and types; `authedGet`, `authedSend`, `authedDelete` (`./client`); `listOf`.
- Produces:
  - `getMyProfile(): Promise<MyProfile>` (React `cache`), `getMyAccount(): Promise<Account>`.
  - `interface ProfilePatch { first_name: string; last_name: string; position?: Position; bio: string; skills: string; github: string | null; linkedin: string | null; portfolio: string | null }`, `updateMyProfile(patch: ProfilePatch): Promise<void>`, `changeMyPassword(password: string): Promise<void>`.
  - `interface ResumeResource<Row, Write> { list(): Promise<Row[]>; create(data: Write): Promise<void>; update(id: number, data: Write): Promise<void>; remove(id: number): Promise<void> }`.
  - `WorkWrite`, `EducationWrite`, `LanguageWrite`, `CertificateWrite` and `workResource`, `educationResource`, `languageResource`, `certificateResource`.
  - `getTeamsWithMembers(): Promise<TeamDetail[]>` in `teams.ts`.

- [ ] **Step 1: Write the failing tests**

`src/server/api/account.test.ts`:
```ts
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
```

`src/server/api/teams.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { authedGet } from "./client";
import { ApiError } from "./errors";
import { getTeamsWithMembers } from "./teams";

vi.mock("./client", () => ({ authedGet: vi.fn(), authedSend: vi.fn(), authedDelete: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("teams", () => {
  it("loads every team's details and skips the ones that are gone", async () => {
    vi.mocked(authedGet).mockImplementation((async (path: string) => {
      if (path === "/teams/") {
        return [
          { id: 1, team_name: "Alpha", team_image: null },
          { id: 2, team_name: "Beta", team_image: null },
        ];
      }
      if (path === "/teams/1/") {
        return { id: 1, team_name: "Alpha", team_image: null, description: "", created_at: "2026-09-28", members: [] };
      }
      throw new ApiError("not_found", 404, `GET ${path} → 404`);
    }) as typeof authedGet);

    const teams = await getTeamsWithMembers();
    expect(teams.map((team) => team.id)).toEqual([1]);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun run test src/server/api/account.test.ts src/server/api/teams.test.ts`
Expected: FAIL — `updateMyProfile`, the resources and `getTeamsWithMembers` don't exist.

- [ ] **Step 3: Implement**

`src/server/api/account.ts` (full rewrite):
```ts
import "server-only";
import { cache } from "react";
import { z, type ZodType } from "zod";
import type { LanguageLevel, Position, WorkingFormat } from "@/src/lib/api-enums";
import { authedDelete, authedGet, authedSend } from "./client";
import {
  certificateSchema,
  educationSchema,
  languageSchema,
  listOf,
  myProfileSchema,
  workSchema,
  type Account,
  type Certificate,
  type Education,
  type Language,
  type MyProfile,
  type Work,
} from "./schemas";

export const getMyProfile = cache((): Promise<MyProfile> => authedGet("/personal-account/", myProfileSchema));

// For callers that only need id, role and status.
export const getMyAccount = (): Promise<Account> => getMyProfile();

// No `role`, `login` or `status`: members can't change those here.
export interface ProfilePatch {
  first_name: string;
  last_name: string;
  position?: Position;
  bio: string;
  skills: string;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
}

export async function updateMyProfile(patch: ProfilePatch): Promise<void> {
  await authedSend("PATCH", "/personal-account/", patch, z.unknown());
}

export async function changeMyPassword(password: string): Promise<void> {
  await authedSend("PATCH", "/personal-account/", { password }, z.unknown());
}

export interface ResumeResource<Row, Write> {
  list(): Promise<Row[]>;
  create(data: Write): Promise<void>;
  update(id: number, data: Write): Promise<void>;
  remove(id: number): Promise<void>;
}

// The four résumé sections share one CRUD shape under /personal-account/.
function resumeResource<Row, Write>(path: string, schema: ZodType<Row>): ResumeResource<Row, Write> {
  return {
    list: cache((): Promise<Row[]> => authedGet(path, listOf(schema))),
    async create(data) {
      await authedSend("POST", path, data, z.unknown());
    },
    async update(id, data) {
      await authedSend("PATCH", `${path}${id}/`, data, z.unknown());
    },
    remove: (id) => authedDelete(`${path}${id}/`),
  };
}

export interface WorkWrite {
  company: string;
  position: string;
  start_time: string;
  end_time: string | null;
  working_format?: WorkingFormat;
  achievements: string;
}

export interface EducationWrite {
  educational_institution: string;
  specialization: string;
  start_year: string;
  end_year: string | null;
  studying_now: boolean;
  responsibilities: string;
}

export interface LanguageWrite {
  languages: string;
  Level: LanguageLevel;
}

export interface CertificateWrite {
  title: string;
  organization: string;
  given_date: string;
  text: string;
}

export const workResource = resumeResource<Work, WorkWrite>("/personal-account/work/", workSchema);
export const educationResource = resumeResource<Education, EducationWrite>(
  "/personal-account/education/",
  educationSchema,
);
export const languageResource = resumeResource<Language, LanguageWrite>("/personal-account/languages/", languageSchema);
export const certificateResource = resumeResource<Certificate, CertificateWrite>(
  "/personal-account/certificates/",
  certificateSchema,
);
```

In `src/server/api/teams.ts`, after `getTeamMembers`, add:
```ts
// Like projects: the list has no members, so each team is loaded (in parallel).
export const getTeamsWithMembers = cache(async (): Promise<TeamDetail[]> => {
  const teams = await getTeams();
  const details = await Promise.all(teams.map((team) => getTeam(team.id)));
  return details.filter((team): team is TeamDetail => team !== null);
});
```

- [ ] **Step 4: Run the tests and the type check**

Run: `bun run test src/server/api && bunx next typegen && bunx tsc --noEmit`
Expected: PASS, exit 0 (the account page still compiles: `getMyAccount` keeps its name and return type).

- [ ] **Step 5: Commit**

```bash
git add src/server/api/account.ts src/server/api/account.test.ts src/server/api/teams.ts src/server/api/teams.test.ts
git commit -m "feat: add cabinet profile and résumé api calls" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Cabinet form validation

**Files:**
- Create: `src/server/validation/account.ts`
- Test: `src/server/validation/account.test.ts`

**Interfaces:**
- Consumes: `nullableUrl`, `parseForm`, `requiredText` (`./form`); `passwordSchema` (`./member`); enums from Task 2.
- Produces: `parseProfile`, `parsePasswordChange` (`data: { password }`), `parseWork`, `parseEducation`, `parseLanguage`, `parseCertificate`. Each returns `ParseResult<…>` whose data is assignable to `ProfilePatch`, `WorkWrite`, `EducationWrite`, `LanguageWrite`, `CertificateWrite` (Task 3).

- [ ] **Step 1: Write the failing test**

`src/server/validation/account.test.ts`:
```ts
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
```

- [ ] **Step 2: Run it to see it fail**

Run: `bun run test src/server/validation/account.test.ts`
Expected: FAIL — `./account` doesn't exist.

- [ ] **Step 3: Implement**

`src/server/validation/account.ts`:
```ts
import { z } from "zod";
import { LANGUAGE_LEVELS, POSITIONS, WORKING_FORMATS } from "@/src/lib/api-enums";
import { nullableUrl, parseForm, requiredText } from "./form";
import { passwordSchema } from "./member";

const BEFORE_START = "Окончание не может быть раньше начала";

const requiredDate = z.iso.date("Укажите дату");
// Blank or absent (the end-date input is hidden while studying) → null.
const optionalDate = z.preprocess(
  (value) => (value === undefined || (typeof value === "string" && value.trim() === "") ? null : value),
  z.iso.date("Укажите дату").nullable(),
);
// "YYYY-MM-DD" strings compare correctly as text.
const notBefore = (start: string, end: string | null) => end === null || end >= start;
// Blank select → leave the field out of the request.
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T, message: string) =>
  z.preprocess((value) => (value === "" ? undefined : value), z.enum(values, message).optional());

// PATCH /personal-account/ profile part. role, login and status aren't
// fields here, so a tampered form can't send them.
const profileSchema = z.object({
  first_name: requiredText(1, 150, "Имя"),
  last_name: requiredText(1, 150, "Фамилия"),
  position: optionalEnum(POSITIONS, "Выберите направление"),
  bio: z.string().trim().max(2000, "Не больше 2000 символов"),
  skills: z.string().trim().max(500, "Не больше 500 символов"),
  github: nullableUrl(),
  linkedin: nullableUrl(),
  portfolio: nullableUrl(),
});

const passwordChangeSchema = z
  .object({ password: passwordSchema, password_repeat: z.string() })
  .refine((data) => data.password === data.password_repeat, {
    path: ["password_repeat"],
    message: "Пароли не совпадают",
  })
  .transform(({ password }) => ({ password }));

const workSchema = z
  .object({
    company: requiredText(1, 150, "Компания"),
    position: requiredText(1, 150, "Должность"),
    start_time: requiredDate,
    end_time: optionalDate,
    working_format: optionalEnum(WORKING_FORMATS, "Выберите формат из списка"),
    achievements: requiredText(1, 2000, "Достижения"),
  })
  .refine((data) => notBefore(data.start_time, data.end_time), { path: ["end_time"], message: BEFORE_START });

const educationSchema = z
  .object({
    educational_institution: requiredText(1, 150, "Учебное заведение"),
    specialization: requiredText(1, 150, "Специализация"),
    start_year: requiredDate,
    // An unticked checkbox isn't sent at all.
    studying_now: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
    end_year: optionalDate,
    responsibilities: requiredText(1, 2000, "Описание"),
  })
  .transform((data) => (data.studying_now ? { ...data, end_year: null } : data))
  .refine((data) => notBefore(data.start_year, data.end_year), { path: ["end_year"], message: BEFORE_START });

const languageSchema = z.object({
  languages: requiredText(1, 150, "Язык"),
  Level: z.enum(LANGUAGE_LEVELS, "Выберите уровень"),
});

const certificateSchema = z.object({
  title: requiredText(1, 150, "Название"),
  organization: requiredText(1, 150, "Организация"),
  given_date: requiredDate,
  text: requiredText(1, 2000, "Описание"),
});

export const parseProfile = (formData: FormData) => parseForm(profileSchema, formData);
export const parsePasswordChange = (formData: FormData) => parseForm(passwordChangeSchema, formData);
export const parseWork = (formData: FormData) => parseForm(workSchema, formData);
export const parseEducation = (formData: FormData) => parseForm(educationSchema, formData);
export const parseLanguage = (formData: FormData) => parseForm(languageSchema, formData);
export const parseCertificate = (formData: FormData) => parseForm(certificateSchema, formData);
```

- [ ] **Step 4: Run the tests**

Run: `bun run test src/server/validation && bunx tsc --noEmit`
Expected: PASS, exit 0. If «rejects an end before the start» fails because zod skipped the refine, check that the base object parses (all other fields valid in that test) before changing anything.

- [ ] **Step 5: Commit**

```bash
git add src/server/validation/account.ts src/server/validation/account.test.ts
git commit -m "feat: validate cabinet profile, password and résumé forms" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: My projects, my teams and résumé formatting

**Files:**
- Modify: `src/server/api/joins.ts`
- Create: `src/lib/resume-format.ts`
- Test: `src/server/api/joins-mine.test.ts`, `src/lib/resume-format.test.ts`

**Interfaces:**
- Produces:
  - `interface MyProject { project: ProjectDetail; role: MembershipRole }`, `myProjects(projects: ProjectDetail[], userId: number): MyProject[]`.
  - `interface MyTeam { team: TeamDetail; role: MembershipRole }`, `myTeams(teams: TeamDetail[], userId: number): MyTeam[]`.
  - `formatMonth(iso)`, `formatDay(iso)`, `formatPeriod(start, end)`, `formatYears(start, end, studyingNow)`, `newestFirst(rows, date)`.

- [ ] **Step 1: Write the failing tests**

`src/server/api/joins-mine.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { MembershipRole } from "@/src/lib/api-enums";
import { myProjects, myTeams } from "./joins";
import type { Membership, ProjectDetail, TeamDetail } from "./schemas";

const row = (user: number, role: MembershipRole): Membership => ({ id: user * 10, user, role });

const project = (id: number, members: Membership[]): ProjectDetail => ({
  id,
  name: `Проект ${id}`,
  project_status: "In_progress",
  category: "Web",
  preview_image: null,
  description: "",
  demo_url: null,
  github_url: null,
  created_at: "2026-09-28T00:00:00+06:00",
  members,
});

const team = (id: number, members: Membership[]): TeamDetail => ({
  id,
  team_name: `Команда ${id}`,
  team_image: null,
  description: "",
  created_at: "2026-09-28T00:00:00+06:00",
  members,
});

describe("my projects and teams", () => {
  it("lists only my projects with my role in each", () => {
    const result = myProjects(
      [project(1, [row(7, "Team_Lead")]), project(2, [row(8, "Developer")]), project(3, [row(8, "Team_Lead"), row(7, "Developer")])],
      7,
    );
    expect(result.map(({ project: item, role }) => [item.id, role])).toEqual([
      [1, "Team_Lead"],
      [3, "Developer"],
    ]);
  });

  it("lists only my teams with my role in each", () => {
    const result = myTeams([team(1, [row(7, "Developer")]), team(2, [row(8, "Team_Lead")])], 7);
    expect(result.map(({ team: item, role }) => [item.id, role])).toEqual([[1, "Developer"]]);
  });

  it("returns nothing for someone in no project or team", () => {
    expect(myProjects([project(1, [row(8, "Developer")])], 7)).toEqual([]);
    expect(myTeams([], 7)).toEqual([]);
  });
});
```

`src/lib/resume-format.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formatDay, formatMonth, formatPeriod, formatYears, newestFirst } from "./resume-format";

describe("resume format", () => {
  it("formats months and days without time-zone drift", () => {
    expect(formatMonth("2024-01-01")).toBe("янв 2024");
    expect(formatDay("2025-03-09")).toBe("9 мар 2025");
  });

  it("shows open periods as ongoing", () => {
    expect(formatPeriod("2024-01-15", null)).toBe("янв 2024 — сейчас");
    expect(formatPeriod("2022-05-01", "2023-12-31")).toBe("май 2022 — дек 2023");
  });

  it("shows study years, or that they still study", () => {
    expect(formatYears("2019-09-01", "2023-06-30", false)).toBe("2019 — 2023");
    expect(formatYears("2021-09-01", null, true)).toBe("2021 — учусь");
  });

  it("returns a value it can't read as is", () => {
    expect(formatMonth("скоро")).toBe("скоро");
  });

  it("sorts newest first without touching the input", () => {
    const rows = [{ at: "2020-01-01" }, { at: "2024-01-01" }, { at: "2022-01-01" }];
    expect(newestFirst(rows, (item) => item.at).map((item) => item.at)).toEqual([
      "2024-01-01",
      "2022-01-01",
      "2020-01-01",
    ]);
    expect(rows[0].at).toBe("2020-01-01");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun run test src/server/api/joins-mine.test.ts src/lib/resume-format.test.ts`
Expected: FAIL — `myProjects` and `./resume-format` don't exist.

- [ ] **Step 3: Implement**

In `src/server/api/joins.ts`, extend the schema type import to `import type { MemberListItem, Membership, ProjectDetail, TeamDetail } from "./schemas";` and append:
```ts
export interface MyProject {
  project: ProjectDetail;
  role: MembershipRole;
}

export interface MyTeam {
  team: TeamDetail;
  role: MembershipRole;
}

const roleOf = (members: Membership[], userId: number): MembershipRole | null =>
  members.find((row) => row.user === userId)?.role ?? null;

// From the full member lists, so it also works for an Admin, who has no
// public profile with a project list.
export const myProjects = (projects: ProjectDetail[], userId: number): MyProject[] =>
  projects.flatMap((project) => {
    const role = roleOf(project.members, userId);
    return role ? [{ project, role }] : [];
  });

export const myTeams = (teams: TeamDetail[], userId: number): MyTeam[] =>
  teams.flatMap((team) => {
    const role = roleOf(team.members, userId);
    return role ? [{ team, role }] : [];
  });
```

`src/lib/resume-format.ts`:
```ts
const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

// API dates are "YYYY-MM-DD". Parsed by hand: new Date() would shift them
// by the server's time zone.
const parts = (iso: string) => {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? { year: match[1], month, day: String(Number(match[3])) } : null;
};

export const formatMonth = (iso: string): string => {
  const date = parts(iso);
  return date ? `${date.month} ${date.year}` : iso;
};

export const formatDay = (iso: string): string => {
  const date = parts(iso);
  return date ? `${date.day} ${date.month} ${date.year}` : iso;
};

export const formatPeriod = (start: string, end: string | null): string =>
  `${formatMonth(start)} — ${end ? formatMonth(end) : "сейчас"}`;

export const formatYears = (start: string, end: string | null, studyingNow: boolean): string =>
  `${start.slice(0, 4)} — ${studyingNow || !end ? "учусь" : end.slice(0, 4)}`;

export const newestFirst = <T>(rows: T[], date: (row: T) => string): T[] =>
  [...rows].sort((a, b) => date(b).localeCompare(date(a)));
```

- [ ] **Step 4: Run the tests**

Run: `bun run test src/server/api src/lib && bunx tsc --noEmit`
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/server/api/joins.ts src/server/api/joins-mine.test.ts src/lib/resume-format.ts src/lib/resume-format.test.ts
git commit -m "feat: find own projects and teams and format résumé dates" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Cabinet Server Actions

**Files:**
- Create: `src/actions/account/profile.ts`, `src/actions/account/resume.ts`
- Test: `src/actions/account/profile.test.ts`, `src/actions/account/resume.test.ts`

**Interfaces:**
- Consumes: Task 1 (`FormState`, `ActionResult`, `echoValues`, `toFormError`, `toActionError`), Task 3 (account API), Task 4 (parsers), `requireRole` (`@/src/server/auth/dal`).
- Produces:
  - `updateProfileAction(prev: FormState, formData: FormData): Promise<FormState>`, `changePasswordAction(prev, formData): Promise<FormState>`.
  - For `Work`, `Education`, `Language`, `Certificate`: `create<X>Action(prev, formData)`, `update<X>Action(id: number, prev, formData)` → `Promise<FormState>`; `delete<X>Action(id: number)` → `Promise<ActionResult>`.

- [ ] **Step 1: Write the failing tests**

`src/actions/account/profile.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath, updateTag } from "next/cache";
import { changeMyPassword, updateMyProfile } from "@/src/server/api/account";
import { ApiError } from "@/src/server/api/errors";
import { changePasswordAction, updateProfileAction } from "./profile";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/src/server/auth/dal", () => ({ requireRole: vi.fn() }));
vi.mock("@/src/server/api/account", () => ({ updateMyProfile: vi.fn(), changeMyPassword: vi.fn() }));

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("profile actions", () => {
  it("saves the profile without role or login and refreshes the public profile", async () => {
    vi.mocked(updateMyProfile).mockResolvedValue(undefined);
    const state = await updateProfileAction(
      {},
      form({
        first_name: "Анвар",
        last_name: "Касымов",
        position: "Frontend_Developer",
        bio: "",
        skills: "React",
        github: "",
        linkedin: "",
        portfolio: "",
        role: "Admin",
        login: "root",
      }),
    );
    expect(state.ok).toBe(true);
    expect(updateMyProfile).toHaveBeenCalledWith({
      first_name: "Анвар",
      last_name: "Касымов",
      position: "Frontend_Developer",
      bio: "",
      skills: "React",
      github: null,
      linkedin: null,
      portfolio: null,
    });
    expect(updateTag).toHaveBeenCalledWith("members");
    expect(revalidatePath).toHaveBeenCalledWith("/account", "layout");
  });

  it("never calls the API when the passwords differ", async () => {
    const state = await changePasswordAction({}, form({ password: "new-secret-1", password_repeat: "other-secret" }));
    expect(state.fieldErrors?.password_repeat).toBe("Пароли не совпадают");
    expect(changeMyPassword).not.toHaveBeenCalled();
  });

  it("shows the backend's password complaint under the field", async () => {
    vi.mocked(changeMyPassword).mockRejectedValue(
      new ApiError("validation", 400, "", { password: "Пароль слишком простой." }),
    );
    const state = await changePasswordAction({}, form({ password: "password1", password_repeat: "password1" }));
    expect(state).toEqual({
      fieldErrors: { password: "Пароль слишком простой." },
      error: "Проверьте поля формы.",
      values: {},
    });
  });
});
```

`src/actions/account/resume.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import {
  certificateResource,
  educationResource,
  languageResource,
  workResource,
} from "@/src/server/api/account";
import { ApiError } from "@/src/server/api/errors";
import {
  createCertificateAction,
  createWorkAction,
  deleteLanguageAction,
  updateEducationAction,
} from "./resume";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/src/server/auth/dal", () => ({ requireRole: vi.fn() }));
vi.mock("@/src/server/api/account", () => {
  const resource = () => ({ create: vi.fn(), update: vi.fn(), remove: vi.fn() });
  return {
    workResource: resource(),
    educationResource: resource(),
    languageResource: resource(),
    certificateResource: resource(),
  };
});

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("résumé actions", () => {
  it("creates a work row from the form and refreshes the cabinet", async () => {
    const state = await createWorkAction(
      {},
      form({
        company: "Motion",
        position: "Frontend",
        start_time: "2024-01-15",
        end_time: "",
        working_format: "remote",
        achievements: "Сделал CRM.",
      }),
    );
    expect(state.ok).toBe(true);
    expect(workResource.create).toHaveBeenCalledWith({
      company: "Motion",
      position: "Frontend",
      start_time: "2024-01-15",
      end_time: null,
      working_format: "remote",
      achievements: "Сделал CRM.",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/account", "layout");
  });

  it("updates the bound education row", async () => {
    await updateEducationAction(
      9,
      {},
      form({
        educational_institution: "КГТУ",
        specialization: "ПИ",
        start_year: "2021-09-01",
        end_year: "",
        studying_now: "on",
        responsibilities: "Учёба",
      }),
    );
    expect(educationResource.update).toHaveBeenCalledWith(9, expect.objectContaining({ studying_now: true, end_year: null }));
  });

  it("keeps an invalid certificate on the form without calling the API", async () => {
    const state = await createCertificateAction({}, form({ title: "", organization: "Meta", given_date: "", text: "" }));
    expect(Object.keys(state.fieldErrors ?? {}).sort()).toEqual(["given_date", "text", "title"]);
    expect(certificateResource.create).not.toHaveBeenCalled();
  });

  it("deletes a language and explains a refusal", async () => {
    vi.mocked(languageResource.remove).mockResolvedValueOnce(undefined);
    await expect(deleteLanguageAction(3)).resolves.toEqual({});
    expect(languageResource.remove).toHaveBeenCalledWith(3);

    vi.mocked(languageResource.remove).mockRejectedValueOnce(new ApiError("forbidden", 403, "x"));
    await expect(deleteLanguageAction(3)).resolves.toEqual({ error: "Недостаточно прав для этого действия." });
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun run test src/actions/account`
Expected: FAIL — `./profile` and `./resume` don't exist.

- [ ] **Step 3: Implement**

`src/actions/account/profile.ts`:
```ts
"use server";

import { revalidatePath, updateTag } from "next/cache";
import { changeMyPassword, updateMyProfile } from "@/src/server/api/account";
import { requireRole } from "@/src/server/auth/dal";
import { parsePasswordChange, parseProfile } from "@/src/server/validation/account";
import { echoValues, type FormState } from "../form-state";
import { toFormError } from "../handle-error";

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole();
  const values = echoValues(formData);
  const parsed = parseProfile(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await updateMyProfile(parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  // The profile is public on /team/[id].
  updateTag("members");
  revalidatePath("/account", "layout");
  return { ok: true, values };
}

// Passwords are never echoed back to the browser.
export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole();
  const parsed = parsePasswordChange(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await changeMyPassword(parsed.data.password);
  } catch (error) {
    return toFormError(error, {});
  }
  return { ok: true };
}
```

`src/actions/account/resume.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import {
  certificateResource,
  educationResource,
  languageResource,
  workResource,
} from "@/src/server/api/account";
import { requireRole } from "@/src/server/auth/dal";
import {
  parseCertificate,
  parseEducation,
  parseLanguage,
  parseWork,
} from "@/src/server/validation/account";
import type { ParseResult } from "@/src/server/validation/form";
import { echoValues, type ActionResult, type FormState } from "../form-state";
import { toActionError, toFormError } from "../handle-error";

// The résumé is private to its owner, so only the cabinet needs refreshing.
const refreshCabinet = () => revalidatePath("/account", "layout");

async function saveRow<T>(
  formData: FormData,
  parse: (formData: FormData) => ParseResult<T>,
  save: (data: T) => Promise<void>,
): Promise<FormState> {
  await requireRole();
  const values = echoValues(formData);
  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await save(parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshCabinet();
  return { ok: true, values };
}

async function removeRow(remove: () => Promise<void>): Promise<ActionResult> {
  await requireRole();
  try {
    await remove();
  } catch (error) {
    return toActionError(error);
  }
  refreshCabinet();
  return {};
}

export async function createWorkAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseWork, (data) => workResource.create(data));
}

export async function updateWorkAction(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseWork, (data) => workResource.update(id, data));
}

export async function deleteWorkAction(id: number): Promise<ActionResult> {
  return removeRow(() => workResource.remove(id));
}

export async function createEducationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseEducation, (data) => educationResource.create(data));
}

export async function updateEducationAction(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseEducation, (data) => educationResource.update(id, data));
}

export async function deleteEducationAction(id: number): Promise<ActionResult> {
  return removeRow(() => educationResource.remove(id));
}

export async function createLanguageAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseLanguage, (data) => languageResource.create(data));
}

export async function updateLanguageAction(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseLanguage, (data) => languageResource.update(id, data));
}

export async function deleteLanguageAction(id: number): Promise<ActionResult> {
  return removeRow(() => languageResource.remove(id));
}

export async function createCertificateAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return saveRow(formData, parseCertificate, (data) => certificateResource.create(data));
}

export async function updateCertificateAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveRow(formData, parseCertificate, (data) => certificateResource.update(id, data));
}

export async function deleteCertificateAction(id: number): Promise<ActionResult> {
  return removeRow(() => certificateResource.remove(id));
}
```

- [ ] **Step 4: Run the tests and the type check**

Run: `bun run test src/actions && bunx tsc --noEmit`
Expected: PASS, exit 0. A type error between a parser's data and a `*Write` interface means Task 3 and Task 4 disagree: align the validation output with the Task 3 interface (the API contract), not the other way round.

- [ ] **Step 5: Commit**

```bash
git add src/actions/account
git commit -m "feat: add cabinet profile and résumé actions" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Shared dashboard shell

**Files:**
- Create: `src/components/dashboard/DashboardShell.tsx`, `src/components/dashboard/DashboardNav.tsx`
- Move: `src/components/admin/AdminShell.module.scss` → `src/components/dashboard/DashboardShell.module.scss`
- Rewrite: `src/components/admin/AdminShell.tsx`
- Delete: `src/components/admin/AdminNav.tsx`
- Modify: `app/(admin)/admin/layout.tsx`

**Interfaces:**
- Consumes: `getMyAccount` (Task 3), `fullName`, `initials` (`@/src/lib/people`), admin icons.
- Produces:
  - `interface DashboardLink { href: string; label: string; icon: ReactNode; count?: number; alert?: boolean }`, `interface DashboardPerson { name: string; caption: string }` (from `DashboardNav.tsx`).
  - `<DashboardShell brand homeHref navLabel links person>{children}</DashboardShell>`.
  - `AdminShell` props `{ counts: NavCounts; person: DashboardPerson; children }`; `NavCounts` now lives in `AdminShell.tsx`.

- [ ] **Step 1: Move the styles and write the shared nav**

```bash
mkdir -p src/components/dashboard
git mv src/components/admin/AdminShell.module.scss src/components/dashboard/DashboardShell.module.scss
```

`src/components/dashboard/DashboardNav.tsx`:
```tsx
"use client";

import { FC, ReactNode, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { logout } from "@/src/actions/auth";
import { LogoutIcon } from "@/src/components/admin/icons";
import { springs } from "@/src/lib/motion-tokens";
import { initials } from "@/src/lib/people";
import scss from "./DashboardShell.module.scss";

export interface DashboardLink {
  href: string;
  label: string;
  icon: ReactNode;
  count?: number;
  // Accent badge = needs attention; plain number = just a total.
  alert?: boolean;
}

export interface DashboardPerson {
  name: string;
  caption: string;
}

export interface DashboardNavProps {
  brand: string;
  homeHref: string;
  navLabel: string;
  links: DashboardLink[];
  person: DashboardPerson;
}

const DashboardNav: FC<DashboardNavProps> = ({ brand, homeHref, navLabel, links, person }) => {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === homeHref ? pathname === href : pathname.startsWith(href));

  return (
    <aside className={scss.sidebar}>
      <div className={scss.sidebar__top}>
        <Link href={homeHref} className={scss.brand} aria-label={`Motion ${brand} — главная`}>
          <Image src="/brand/motion-logo.svg" alt="" width={40} height={21} />
          <span>{brand}</span>
        </Link>
        <button
          type="button"
          className={scss.toggle}
          aria-expanded={open}
          aria-controls="dashboard-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Закрыть" : "Меню"}
        </button>
      </div>

      <nav id="dashboard-nav" className={`${scss.nav} ${open ? scss["nav--open"] : ""}`} aria-label={navLabel}>
        <ul>
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${scss.nav__link} ${active ? scss["nav__link--active"] : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {active && (
                    <motion.span
                      layoutId="dashboard-nav-pill"
                      className={scss.nav__pill}
                      transition={reduce ? { duration: 0 } : springs.snappy}
                    />
                  )}
                  <span className={scss.nav__icon}>{link.icon}</span>
                  <span className={scss.nav__label}>{link.label}</span>
                  {link.count !== undefined && (
                    <span
                      className={`${scss.nav__count} ${link.alert ? scss["nav__count--alert"] : ""}`}
                      aria-label={link.alert ? `Новых: ${link.count}` : `Всего: ${link.count}`}
                    >
                      {link.count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={scss.account}>
          <span className={scss.account__avatar} aria-hidden="true">
            {initials(person.name)}
          </span>
          <span className={scss.account__name}>
            {person.name}
            <small>{person.caption}</small>
          </span>
          <form action={logout}>
            <button type="submit" className={scss.account__logout} aria-label="Выйти">
              <LogoutIcon />
            </button>
          </form>
        </div>
      </nav>
    </aside>
  );
};

export default DashboardNav;
```

`src/components/dashboard/DashboardShell.tsx`:
```tsx
import { FC, ReactNode } from "react";
import DashboardNav, { type DashboardNavProps } from "./DashboardNav";
import scss from "./DashboardShell.module.scss";

// Sidebar + content frame shared by the admin and the member cabinet.
const DashboardShell: FC<DashboardNavProps & { children: ReactNode }> = ({ children, ...nav }) => (
  <div className={scss.shell}>
    <DashboardNav {...nav} />
    <main className={scss.content}>{children}</main>
  </div>
);

export default DashboardShell;
```

- [ ] **Step 2: Point the admin at the shared shell**

`src/components/admin/AdminShell.tsx` (full rewrite):
```tsx
import { FC, ReactNode } from "react";
import DashboardShell from "@/src/components/dashboard/DashboardShell";
import type { DashboardPerson } from "@/src/components/dashboard/DashboardNav";
import { MembersIcon, OverviewIcon, ProjectsIcon, RequestsIcon, TeamsIcon } from "./icons";

export interface NavCounts {
  members: number;
  teams: number;
  projects: number;
  newRequests: number;
}

interface AdminShellProps {
  counts: NavCounts;
  person: DashboardPerson;
  children: ReactNode;
}

const AdminShell: FC<AdminShellProps> = ({ counts, person, children }) => (
  <DashboardShell
    brand="admin"
    homeHref="/admin"
    navLabel="Разделы админки"
    person={person}
    links={[
      { href: "/admin", label: "Обзор", icon: <OverviewIcon /> },
      { href: "/admin/members", label: "Участники", icon: <MembersIcon />, count: counts.members },
      { href: "/admin/teams", label: "Команды", icon: <TeamsIcon />, count: counts.teams },
      { href: "/admin/projects", label: "Проекты", icon: <ProjectsIcon />, count: counts.projects },
      {
        href: "/admin/requests",
        label: "Заявки",
        icon: <RequestsIcon />,
        count: counts.newRequests || undefined,
        alert: true,
      },
    ]}
  >
    {children}
  </DashboardShell>
);

export default AdminShell;
```

```bash
git rm src/components/admin/AdminNav.tsx
```

In `app/(admin)/admin/layout.tsx`:
- add imports `import { fullName } from "@/src/lib/people";` and `import { getMyAccount } from "@/src/server/api/account";`;
- extend the `Promise.all` to `const [members, teams, projects, requests, me] = await Promise.all([getMembers(true), getTeams(), getProjects(true), getClientRequests(), getMyAccount()]);`;
- render `<AdminShell counts={counts} person={{ name: fullName(me, me.login), caption: "Администратор" }}>{children}</AdminShell>`.

- [ ] **Step 3: Type check, tests and a smoke test**

Run: `grep -rn "AdminNav\|admin/AdminShell.module" app src` → no output.
Run: `bun run test && bunx next typegen && bunx tsc --noEmit`
Expected: PASS, exit 0.

With a server running (`bun run build && bunx next start -p 3100` when :3000 is taken):
`curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3100/admin`
Expected: `307 http://localhost:3100/login`.

- [ ] **Step 4: Commit**

```bash
git add -A src/components/dashboard src/components/admin "app/(admin)/admin/layout.tsx"
git commit -m "refactor: share the dashboard shell between admin and cabinet" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Cabinet shell and the profile page

**Files:**
- Rewrite: `app/(account)/layout.tsx`, `app/(account)/account/page.tsx`
- Create: `app/(account)/account/layout.tsx`, `app/(account)/error.tsx`, `src/components/account/PasswordForm.tsx`
- Modify: `src/components/admin/members/MemberProfileForm.tsx` (`showLogin`)
- Delete: `src/components/AccountPlaceholder.tsx`, `src/components/AccountPlaceholder.module.scss`

**Interfaces:**
- Consumes: Task 3 (`getMyProfile`), Task 6 (`updateProfileAction`, `changePasswordAction`), Task 7 (`DashboardShell`, `DashboardLink`), `requireRole`, labels, `fullName`.
- Produces: `MemberProfileForm` prop `showLogin?: boolean` (default `true`); routes `/account` (this task) and nav links to `/account/resume`, `/account/projects`, `/account/teams` (pages in Tasks 9–10).

- [ ] **Step 1: Group layout, error boundary and cabinet layout**

`app/(account)/layout.tsx` (full rewrite):
```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Кабинет — Motion Community",
  robots: { index: false, follow: false },
};

// No site header/footer: the cabinet has its own shell (account/layout.tsx).
export default function AccountGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

`app/(account)/error.tsx`:
```tsx
"use client";

import LoadError from "@/src/components/errors/LoadError";

// Above account/layout.tsx so it also catches errors from the shell's own load.
export default function AccountError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <LoadError title="Не удалось загрузить кабинет" retry={retry} />;
}
```

`app/(account)/account/layout.tsx`:
```tsx
import type { ReactNode } from "react";
import DashboardShell from "@/src/components/dashboard/DashboardShell";
import type { DashboardLink } from "@/src/components/dashboard/DashboardNav";
import { ArrowRightIcon, OverviewIcon, ProjectsIcon, RequestsIcon, TeamsIcon } from "@/src/components/admin/icons";
import { USER_ROLE_LABELS, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { getMyProfile } from "@/src/server/api/account";
import { requireRole } from "@/src/server/auth/dal";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireRole();
  const me = await getMyProfile();
  const links: DashboardLink[] = [
    { href: "/account", label: "Профиль", icon: <OverviewIcon /> },
    { href: "/account/resume", label: "Резюме", icon: <RequestsIcon /> },
    { href: "/account/projects", label: "Мои проекты", icon: <ProjectsIcon /> },
    { href: "/account/teams", label: "Мои команды", icon: <TeamsIcon /> },
  ];
  if (me.role === "Admin") links.push({ href: "/admin", label: "Админка", icon: <ArrowRightIcon /> });

  return (
    <DashboardShell
      brand="кабинет"
      homeHref="/account"
      navLabel="Разделы кабинета"
      links={links}
      person={{ name: fullName(me, me.login), caption: positionLabel(me.position) ?? USER_ROLE_LABELS[me.role] }}
    >
      {children}
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Profile form without the login field**

In `src/components/admin/members/MemberProfileForm.tsx`:
- add `showLogin?: boolean;` to `MemberProfileFormProps` with the comment `// The cabinet hides it: only the admin changes logins.`;
- destructure `showLogin = true`;
- wrap the «Логин» `Field` in `{showLogin && ( … )}`.

`src/components/account/PasswordForm.tsx`:
```tsx
"use client";

import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import type { FormState } from "@/src/actions/form-state";

interface PasswordFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}

const PasswordForm: FC<PasswordFormProps> = ({ action }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});

  return (
    <form action={formAction} className={ui.formGrid} noValidate>
      <Field label="Новый пароль" htmlFor="account-password" required error={errors.password} hint="От 8 до 64 символов" full>
        <input
          id="account-password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "account-password-error" : undefined}
        />
      </Field>
      <Field label="Повторите пароль" htmlFor="account-password_repeat" required error={errors.password_repeat} full>
        <input
          id="account-password_repeat"
          name="password_repeat"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password_repeat)}
          aria-describedby={errors.password_repeat ? "account-password_repeat-error" : undefined}
        />
      </Field>
      <FormActions submitLabel="Сменить пароль" pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default PasswordForm;
```

- [ ] **Step 3: Profile page**

`app/(account)/account/page.tsx` (full rewrite):
```tsx
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
```

```bash
git rm src/components/AccountPlaceholder.tsx src/components/AccountPlaceholder.module.scss
```

- [ ] **Step 4: Tests, type check, smoke test**

Run: `bun run test && bunx next typegen && bunx tsc --noEmit`
Expected: PASS, exit 0.

With a fresh production server: `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3100/account`
Expected: `307 http://localhost:3100/login`.

- [ ] **Step 5: Commit**

```bash
git add -A "app/(account)" src/components/account src/components/admin/members/MemberProfileForm.tsx src/components/AccountPlaceholder.tsx src/components/AccountPlaceholder.module.scss
git commit -m "feat: add the cabinet shell and profile page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Résumé page

**Files:**
- Create:
  - `src/components/account/ResumeItemDialog.tsx`, `src/components/account/use-resume-form.ts`
  - `src/components/account/resume/resume-values.ts`, `ResumeSection.tsx`, `Resume.module.scss`
  - `src/components/account/resume/{WorkForm,WorkSection,EducationForm,EducationSection,LanguageForm,LanguageSection,CertificateForm,CertificateSection}.tsx`
  - `app/(account)/account/resume/page.tsx`

**Interfaces:**
- Consumes: Task 2 types and enums, Task 3 resources, Task 5 formatters, Task 6 résumé actions, admin UI kit, `EditProfileDialog.module.scss`.
- Produces: `/account/resume`.

- [ ] **Step 1: Form values, the hook and the dialog**

`src/components/account/resume/resume-values.ts` (no `"use client"`: server pages import these):
```ts
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
```

`src/components/account/use-resume-form.ts`:
```ts
import { useActionState, useEffect, useId } from "react";
import type { FormState } from "@/src/actions/form-state";

export type ResumeAction = (prev: FormState, formData: FormData) => Promise<FormState>;

// Shared wiring of the four résumé forms: action state, values echoed back
// after a failed save, unique ids (several dialogs share one page) and
// closing the dialog once the row is saved.
export function useResumeForm<V extends { [K in keyof V]: string }>(
  action: ResumeAction,
  initial: V,
  onSaved: () => void,
) {
  const [state, formAction, pending] = useActionState(action, {});
  const uid = useId();
  const errors = pending ? {} : (state.fieldErrors ?? {});

  useEffect(() => {
    if (state.ok) onSaved();
  }, [state, onSaved]);

  const id = (name: keyof V & string) => `${uid}-${name}`;
  const value = (name: keyof V & string): string => state.values?.[name] ?? initial[name];
  const control = (name: keyof V & string) => ({
    id: id(name),
    name,
    defaultValue: value(name),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${id(name)}-error` : undefined,
  });

  return { state, formAction, pending, errors, id, value, control };
}
```

`src/components/account/ResumeItemDialog.tsx`:
```tsx
"use client";

import { FC, ReactNode, useCallback, useId, useRef, useState } from "react";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import scss from "@/src/components/admin/members/EditProfileDialog.module.scss";
import type { ResumeAction } from "./use-resume-form";

// Props of the four `<X>Form` dialogs.
export interface ResumeDialogProps<V> {
  triggerLabel: string;
  title: string;
  primary?: boolean;
  action: ResumeAction;
  initial: V;
}

interface ResumeItemDialogProps {
  triggerLabel: string;
  title: string;
  primary?: boolean;
  children: (onSaved: () => void) => ReactNode;
}

// Native <dialog> + showModal(), like the admin's «Изменить профиль». The
// form mounts only while the dialog is open, so each opening starts clean.
const ResumeItemDialog: FC<ResumeItemDialogProps> = ({ triggerLabel, title, primary, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => dialogRef.current?.close(), []);

  const show = () => {
    setOpen(true);
    dialogRef.current?.showModal();
  };

  return (
    <>
      <button
        type="button"
        className={`${ui.smallButton} ${primary ? ui["smallButton--solid"] : ""}`}
        onClick={show}
      >
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        className={scss.dialog}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // A click on the backdrop (the dialog element itself) closes it.
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className={scss.formStep}>
          <div className={scss.formStep__head}>
            <h2 id={titleId} className={scss.title}>
              {title}
            </h2>
            <button type="button" className={scss.close} onClick={close} aria-label="Закрыть">
              ×
            </button>
          </div>
          {open && children(close)}
        </div>
      </dialog>
    </>
  );
};

export default ResumeItemDialog;
```

- [ ] **Step 2: Section frame and styles**

`src/components/account/resume/Resume.module.scss`:
```scss
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
}

.add {
  margin-top: 12px;
}

.card {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-2);
}

.card__body {
  flex: 1 1 260px;
  min-width: 0;
}

.card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-paper);
}

.card__meta {
  margin-top: 2px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-mist);
}

.card__text {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--color-mist);
}

.card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
```

`src/components/account/resume/ResumeSection.tsx`:
```tsx
import { FC, ReactNode } from "react";
import Panel from "@/src/components/admin/ui/Panel";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import scss from "./Resume.module.scss";

interface ResumeSectionProps {
  title: string;
  isEmpty: boolean;
  add: ReactNode;
  children: ReactNode;
}

export const ResumeSection: FC<ResumeSectionProps> = ({ title, isEmpty, add, children }) => (
  <Panel title={title}>
    {isEmpty ? (
      <p className={ui.empty}>Пока пусто — добавьте первую запись.</p>
    ) : (
      <ul className={scss.list}>{children}</ul>
    )}
    <div className={scss.add}>{add}</div>
  </Panel>
);

interface ResumeCardProps {
  title: string;
  meta: string[];
  text?: string;
  actions: ReactNode;
}

export const ResumeCard: FC<ResumeCardProps> = ({ title, meta, text, actions }) => (
  <li className={scss.card}>
    <div className={scss.card__body}>
      <p className={scss.card__title}>{title}</p>
      {meta.length > 0 && <p className={scss.card__meta}>{meta.join(" · ")}</p>}
      {text && <p className={scss.card__text}>{text}</p>}
    </div>
    <div className={scss.card__actions}>{actions}</div>
  </li>
);
```

- [ ] **Step 3: Work**

`src/components/account/resume/WorkForm.tsx`:
```tsx
"use client";

import { FC } from "react";
import Select from "@/src/ui/Select";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import { WORKING_FORMATS } from "@/src/lib/api-enums";
import { WORKING_FORMAT_LABELS } from "@/src/lib/api-labels";
import ResumeItemDialog, { type ResumeDialogProps } from "../ResumeItemDialog";
import { useResumeForm, type ResumeAction } from "../use-resume-form";
import type { WorkValues } from "./resume-values";

const FORMAT_OPTIONS = [
  { value: "", label: "Не указан" },
  ...WORKING_FORMATS.map((value) => ({ value, label: WORKING_FORMAT_LABELS[value] })),
];

interface WorkFormProps {
  action: ResumeAction;
  initial: WorkValues;
  onSaved: () => void;
}

const WorkForm: FC<WorkFormProps> = ({ action, initial, onSaved }) => {
  const { state, formAction, pending, errors, id, value, control } = useResumeForm(action, initial, onSaved);

  return (
    <form action={formAction} className={ui.formGrid} noValidate>
      <Field label="Должность" htmlFor={id("position")} required error={errors.position}>
        <input {...control("position")} />
      </Field>
      <Field label="Компания" htmlFor={id("company")} required error={errors.company}>
        <input {...control("company")} />
      </Field>
      <Field label="Начало" htmlFor={id("start_time")} required error={errors.start_time}>
        <input {...control("start_time")} type="date" />
      </Field>
      <Field label="Окончание" htmlFor={id("end_time")} error={errors.end_time} hint="Пусто — работаю сейчас">
        <input {...control("end_time")} type="date" />
      </Field>
      <Field label="Формат работы" htmlFor={id("working_format")} error={errors.working_format} full>
        <Select
          id={id("working_format")}
          name="working_format"
          defaultValue={value("working_format")}
          invalid={Boolean(errors.working_format)}
          describedBy={errors.working_format ? `${id("working_format")}-error` : undefined}
          block
          options={FORMAT_OPTIONS}
        />
      </Field>
      <Field label="Достижения" htmlFor={id("achievements")} required error={errors.achievements} full>
        <textarea {...control("achievements")} rows={4} />
      </Field>
      <FormActions submitLabel="Сохранить" pending={pending} error={state.error} />
    </form>
  );
};

const WorkDialog: FC<ResumeDialogProps<WorkValues>> = ({ action, initial, ...dialog }) => (
  <ResumeItemDialog {...dialog}>
    {(onSaved) => <WorkForm action={action} initial={initial} onSaved={onSaved} />}
  </ResumeItemDialog>
);

export default WorkDialog;
```

`src/components/account/resume/WorkSection.tsx`:
```tsx
import { FC } from "react";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import { createWorkAction, deleteWorkAction, updateWorkAction } from "@/src/actions/account/resume";
import { WORKING_FORMAT_LABELS } from "@/src/lib/api-labels";
import { formatPeriod } from "@/src/lib/resume-format";
import type { Work } from "@/src/server/api/schemas";
import WorkDialog from "./WorkForm";
import { ResumeCard, ResumeSection } from "./ResumeSection";
import { EMPTY_WORK, workValues } from "./resume-values";

const WorkSection: FC<{ rows: Work[] }> = ({ rows }) => (
  <ResumeSection
    title="Опыт работы"
    isEmpty={rows.length === 0}
    add={
      <WorkDialog
        triggerLabel="Добавить опыт"
        title="Новое место работы"
        primary
        action={createWorkAction}
        initial={EMPTY_WORK}
      />
    }
  >
    {rows.map((row) => (
      <ResumeCard
        key={row.id}
        title={`${row.position} · ${row.company}`}
        meta={[
          formatPeriod(row.start_time, row.end_time),
          ...(row.working_format ? [WORKING_FORMAT_LABELS[row.working_format]] : []),
        ]}
        text={row.achievements}
        actions={
          <>
            <WorkDialog
              triggerLabel="Изменить"
              title="Место работы"
              action={updateWorkAction.bind(null, row.id)}
              initial={workValues(row)}
            />
            <ConfirmButton label="Удалить" confirmLabel="Да, удалить" danger onConfirm={deleteWorkAction.bind(null, row.id)} />
          </>
        }
      />
    ))}
  </ResumeSection>
);

export default WorkSection;
```

- [ ] **Step 4: Education**

`src/components/account/resume/EducationForm.tsx`:
```tsx
"use client";

import { FC, useState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import ResumeItemDialog, { type ResumeDialogProps } from "../ResumeItemDialog";
import { useResumeForm, type ResumeAction } from "../use-resume-form";
import type { EducationValues } from "./resume-values";
import scss from "./Resume.module.scss";

interface EducationFormProps {
  action: ResumeAction;
  initial: EducationValues;
  onSaved: () => void;
}

const EducationForm: FC<EducationFormProps> = ({ action, initial, onSaved }) => {
  const { state, formAction, pending, errors, id, control } = useResumeForm(action, initial, onSaved);
  // Controls whether the end date is asked for at all.
  const [studying, setStudying] = useState(initial.studying_now === "on");

  return (
    <form action={formAction} className={ui.formGrid} noValidate>
      <Field label="Учебное заведение" htmlFor={id("educational_institution")} required error={errors.educational_institution} full>
        <input {...control("educational_institution")} />
      </Field>
      <Field label="Специализация" htmlFor={id("specialization")} required error={errors.specialization} full>
        <input {...control("specialization")} />
      </Field>
      <Field label="Начало" htmlFor={id("start_year")} required error={errors.start_year}>
        <input {...control("start_year")} type="date" />
      </Field>
      {!studying && (
        <Field label="Окончание" htmlFor={id("end_year")} error={errors.end_year}>
          <input {...control("end_year")} type="date" />
        </Field>
      )}
      <div className={`${ui.field} ${ui["field--full"]}`}>
        <label className={scss.check}>
          <input
            type="checkbox"
            name="studying_now"
            defaultChecked={studying}
            onChange={(event) => setStudying(event.target.checked)}
          />
          Учусь сейчас
        </label>
      </div>
      <Field label="Описание" htmlFor={id("responsibilities")} required error={errors.responsibilities} full>
        <textarea {...control("responsibilities")} rows={3} />
      </Field>
      <FormActions submitLabel="Сохранить" pending={pending} error={state.error} />
    </form>
  );
};

const EducationDialog: FC<ResumeDialogProps<EducationValues>> = ({ action, initial, ...dialog }) => (
  <ResumeItemDialog {...dialog}>
    {(onSaved) => <EducationForm action={action} initial={initial} onSaved={onSaved} />}
  </ResumeItemDialog>
);

export default EducationDialog;
```

`src/components/account/resume/EducationSection.tsx`:
```tsx
import { FC } from "react";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import {
  createEducationAction,
  deleteEducationAction,
  updateEducationAction,
} from "@/src/actions/account/resume";
import { formatYears } from "@/src/lib/resume-format";
import type { Education } from "@/src/server/api/schemas";
import EducationDialog from "./EducationForm";
import { ResumeCard, ResumeSection } from "./ResumeSection";
import { EMPTY_EDUCATION, educationValues } from "./resume-values";

const EducationSection: FC<{ rows: Education[] }> = ({ rows }) => (
  <ResumeSection
    title="Образование"
    isEmpty={rows.length === 0}
    add={
      <EducationDialog
        triggerLabel="Добавить образование"
        title="Новое образование"
        primary
        action={createEducationAction}
        initial={EMPTY_EDUCATION}
      />
    }
  >
    {rows.map((row) => (
      <ResumeCard
        key={row.id}
        title={`${row.specialization} · ${row.educational_institution}`}
        meta={[formatYears(row.start_year, row.end_year, row.studying_now)]}
        text={row.responsibilities}
        actions={
          <>
            <EducationDialog
              triggerLabel="Изменить"
              title="Образование"
              action={updateEducationAction.bind(null, row.id)}
              initial={educationValues(row)}
            />
            <ConfirmButton
              label="Удалить"
              confirmLabel="Да, удалить"
              danger
              onConfirm={deleteEducationAction.bind(null, row.id)}
            />
          </>
        }
      />
    ))}
  </ResumeSection>
);

export default EducationSection;
```

- [ ] **Step 5: Languages**

`src/components/account/resume/LanguageForm.tsx`:
```tsx
"use client";

import { FC } from "react";
import Select from "@/src/ui/Select";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import { LANGUAGE_LEVELS } from "@/src/lib/api-enums";
import ResumeItemDialog, { type ResumeDialogProps } from "../ResumeItemDialog";
import { useResumeForm, type ResumeAction } from "../use-resume-form";
import type { LanguageValues } from "./resume-values";

const LEVEL_OPTIONS = [
  { value: "", label: "Выберите уровень" },
  ...LANGUAGE_LEVELS.map((value) => ({ value, label: value })),
];

interface LanguageFormProps {
  action: ResumeAction;
  initial: LanguageValues;
  onSaved: () => void;
}

const LanguageForm: FC<LanguageFormProps> = ({ action, initial, onSaved }) => {
  const { state, formAction, pending, errors, id, value, control } = useResumeForm(action, initial, onSaved);

  return (
    <form action={formAction} className={ui.formGrid} noValidate>
      <Field label="Язык" htmlFor={id("languages")} required error={errors.languages}>
        <input {...control("languages")} placeholder="Например, английский" />
      </Field>
      <Field label="Уровень" htmlFor={id("Level")} required error={errors.Level}>
        <Select
          id={id("Level")}
          name="Level"
          defaultValue={value("Level")}
          invalid={Boolean(errors.Level)}
          describedBy={errors.Level ? `${id("Level")}-error` : undefined}
          block
          options={LEVEL_OPTIONS}
        />
      </Field>
      <FormActions submitLabel="Сохранить" pending={pending} error={state.error} />
    </form>
  );
};

const LanguageDialog: FC<ResumeDialogProps<LanguageValues>> = ({ action, initial, ...dialog }) => (
  <ResumeItemDialog {...dialog}>
    {(onSaved) => <LanguageForm action={action} initial={initial} onSaved={onSaved} />}
  </ResumeItemDialog>
);

export default LanguageDialog;
```

`src/components/account/resume/LanguageSection.tsx`:
```tsx
import { FC } from "react";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import {
  createLanguageAction,
  deleteLanguageAction,
  updateLanguageAction,
} from "@/src/actions/account/resume";
import type { Language } from "@/src/server/api/schemas";
import LanguageDialog from "./LanguageForm";
import { ResumeCard, ResumeSection } from "./ResumeSection";
import { EMPTY_LANGUAGE, languageValues } from "./resume-values";

const LanguageSection: FC<{ rows: Language[] }> = ({ rows }) => (
  <ResumeSection
    title="Языки"
    isEmpty={rows.length === 0}
    add={
      <LanguageDialog
        triggerLabel="Добавить язык"
        title="Новый язык"
        primary
        action={createLanguageAction}
        initial={EMPTY_LANGUAGE}
      />
    }
  >
    {rows.map((row) => (
      <ResumeCard
        key={row.id}
        title={`${row.languages} — ${row.Level ?? "уровень не указан"}`}
        meta={[]}
        actions={
          <>
            <LanguageDialog
              triggerLabel="Изменить"
              title="Язык"
              action={updateLanguageAction.bind(null, row.id)}
              initial={languageValues(row)}
            />
            <ConfirmButton
              label="Удалить"
              confirmLabel="Да, удалить"
              danger
              onConfirm={deleteLanguageAction.bind(null, row.id)}
            />
          </>
        }
      />
    ))}
  </ResumeSection>
);

export default LanguageSection;
```

- [ ] **Step 6: Certificates**

`src/components/account/resume/CertificateForm.tsx`:
```tsx
"use client";

import { FC } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import ResumeItemDialog, { type ResumeDialogProps } from "../ResumeItemDialog";
import { useResumeForm, type ResumeAction } from "../use-resume-form";
import type { CertificateValues } from "./resume-values";

interface CertificateFormProps {
  action: ResumeAction;
  initial: CertificateValues;
  onSaved: () => void;
}

const CertificateForm: FC<CertificateFormProps> = ({ action, initial, onSaved }) => {
  const { state, formAction, pending, errors, id, control } = useResumeForm(action, initial, onSaved);

  return (
    <form action={formAction} className={ui.formGrid} noValidate>
      <Field label="Название" htmlFor={id("title")} required error={errors.title}>
        <input {...control("title")} />
      </Field>
      <Field label="Организация" htmlFor={id("organization")} required error={errors.organization}>
        <input {...control("organization")} />
      </Field>
      <Field label="Дата выдачи" htmlFor={id("given_date")} required error={errors.given_date}>
        <input {...control("given_date")} type="date" />
      </Field>
      <Field label="Описание" htmlFor={id("text")} required error={errors.text} full>
        <textarea {...control("text")} rows={3} />
      </Field>
      <FormActions submitLabel="Сохранить" pending={pending} error={state.error} />
    </form>
  );
};

const CertificateDialog: FC<ResumeDialogProps<CertificateValues>> = ({ action, initial, ...dialog }) => (
  <ResumeItemDialog {...dialog}>
    {(onSaved) => <CertificateForm action={action} initial={initial} onSaved={onSaved} />}
  </ResumeItemDialog>
);

export default CertificateDialog;
```

`src/components/account/resume/CertificateSection.tsx`:
```tsx
import { FC } from "react";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import {
  createCertificateAction,
  deleteCertificateAction,
  updateCertificateAction,
} from "@/src/actions/account/resume";
import { formatDay } from "@/src/lib/resume-format";
import type { Certificate } from "@/src/server/api/schemas";
import CertificateDialog from "./CertificateForm";
import { ResumeCard, ResumeSection } from "./ResumeSection";
import { EMPTY_CERTIFICATE, certificateValues } from "./resume-values";

const CertificateSection: FC<{ rows: Certificate[] }> = ({ rows }) => (
  <ResumeSection
    title="Сертификаты"
    isEmpty={rows.length === 0}
    add={
      <CertificateDialog
        triggerLabel="Добавить сертификат"
        title="Новый сертификат"
        primary
        action={createCertificateAction}
        initial={EMPTY_CERTIFICATE}
      />
    }
  >
    {rows.map((row) => (
      <ResumeCard
        key={row.id}
        title={`${row.title} · ${row.organization}`}
        meta={[formatDay(row.given_date)]}
        text={row.text}
        actions={
          <>
            <CertificateDialog
              triggerLabel="Изменить"
              title="Сертификат"
              action={updateCertificateAction.bind(null, row.id)}
              initial={certificateValues(row)}
            />
            <ConfirmButton
              label="Удалить"
              confirmLabel="Да, удалить"
              danger
              onConfirm={deleteCertificateAction.bind(null, row.id)}
            />
          </>
        }
      />
    ))}
  </ResumeSection>
);

export default CertificateSection;
```

- [ ] **Step 7: The page**

`app/(account)/account/resume/page.tsx`:
```tsx
import PageHeader from "@/src/components/admin/ui/PageHeader";
import CertificateSection from "@/src/components/account/resume/CertificateSection";
import EducationSection from "@/src/components/account/resume/EducationSection";
import LanguageSection from "@/src/components/account/resume/LanguageSection";
import WorkSection from "@/src/components/account/resume/WorkSection";
import { newestFirst } from "@/src/lib/resume-format";
import {
  certificateResource,
  educationResource,
  languageResource,
  workResource,
} from "@/src/server/api/account";
import { requireRole } from "@/src/server/auth/dal";

const Page = async () => {
  await requireRole();
  const [work, education, languages, certificates] = await Promise.all([
    workResource.list(),
    educationResource.list(),
    languageResource.list(),
    certificateResource.list(),
  ]);

  return (
    <>
      <PageHeader
        title="Резюме"
        description="Резюме пока видно только вам: публичная страница участника его не показывает."
      />
      <WorkSection rows={newestFirst(work, (row) => row.start_time)} />
      <EducationSection rows={newestFirst(education, (row) => row.start_year)} />
      <LanguageSection rows={languages} />
      <CertificateSection rows={newestFirst(certificates, (row) => row.given_date)} />
    </>
  );
};

export default Page;
```

- [ ] **Step 8: Tests, type check, lint**

Run: `bun run test && bunx next typegen && bunx tsc --noEmit && bun run lint`
Expected: PASS, tsc exit 0, lint 0 errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/account "app/(account)/account/resume"
git commit -m "feat: edit the résumé in the cabinet" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: My projects and my teams pages

**Files:**
- Modify: `src/components/admin/projects/ProjectCard.tsx` (`href`, `note`)
- Create: `app/(account)/account/projects/page.tsx`, `app/(account)/account/teams/page.tsx`

**Interfaces:**
- Consumes: Task 3 (`getMyProfile`, `getTeamsWithMembers`), Task 5 (`myProjects`, `myTeams`), `getProjectsWithMembers`, `getMembers`, `withPeople`, `ProjectCard`, `PersonCell`.
- Produces: `ProjectCard` props `{ project; team; href?: string; note?: string }` (the admin keeps its defaults); `/account/projects`, `/account/teams`.

- [ ] **Step 1: ProjectCard link and note**

In `src/components/admin/projects/ProjectCard.tsx`:
- change the props to `{ project: ProjectDetail; team: TeamPerson[]; href?: string; note?: string }` (inline type stays an object type on `FC<…>`);
- `<Link href={href ?? `/admin/projects/${project.id}`} className={scss.card}>`;
- right after the name span, add `{note && <span className={scss.card__meta}>{note}</span>}`.

- [ ] **Step 2: Pages**

`app/(account)/account/projects/page.tsx`:
```tsx
import EmptyState from "@/src/components/admin/ui/EmptyState";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import ProjectCard from "@/src/components/admin/projects/ProjectCard";
import cards from "@/src/components/admin/projects/ProjectCard.module.scss";
import { MEMBERSHIP_ROLE_LABELS } from "@/src/lib/api-labels";
import { getMyProfile } from "@/src/server/api/account";
import { myProjects, withPeople } from "@/src/server/api/joins";
import { getMembers } from "@/src/server/api/members";
import { getProjectsWithMembers } from "@/src/server/api/projects";
import { requireRole } from "@/src/server/auth/dal";

const Page = async () => {
  await requireRole();
  const [me, projects, roster] = await Promise.all([getMyProfile(), getProjectsWithMembers(), getMembers()]);
  const mine = myProjects(projects, me.id);

  return (
    <>
      <PageHeader title="Мои проекты" description="Проекты, в которых вы участвуете." />
      {mine.length === 0 ? (
        <EmptyState title="Вас пока не добавили ни в один проект." />
      ) : (
        <div className={cards.grid}>
          {mine.map(({ project, role }) => (
            <ProjectCard
              key={project.id}
              project={project}
              team={withPeople(project.members, roster)}
              href={`/projects/${project.id}`}
              note={`Моя роль: ${MEMBERSHIP_ROLE_LABELS[role]}`}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default Page;
```

`app/(account)/account/teams/page.tsx`:
```tsx
import EmptyState from "@/src/components/admin/ui/EmptyState";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import ui from "@/src/components/admin/ui/admin-ui.module.scss";
import PersonCell from "@/src/components/admin/PersonCell";
import { MEMBERSHIP_ROLE_LABELS } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { getMyProfile } from "@/src/server/api/account";
import { myTeams, withPeople } from "@/src/server/api/joins";
import { getMembers } from "@/src/server/api/members";
import { getTeamsWithMembers } from "@/src/server/api/teams";
import { requireRole } from "@/src/server/auth/dal";

const Page = async () => {
  await requireRole();
  const [me, teams, roster] = await Promise.all([getMyProfile(), getTeamsWithMembers(), getMembers()]);
  const mine = myTeams(teams, me.id);

  return (
    <>
      <PageHeader title="Мои команды" description="Команды, в которых вы состоите." />
      {mine.length === 0 ? (
        <EmptyState title="Вы пока не состоите ни в одной команде." />
      ) : (
        mine.map(({ team, role }) => (
          <Panel key={team.id} title={team.team_name}>
            <p style={{ marginBottom: 12 }}>
              <StatusBadge tone={role === "Team_Lead" ? "accent" : "neutral"}>
                Моя роль: {MEMBERSHIP_ROLE_LABELS[role]}
              </StatusBadge>
            </p>
            {team.description && <p className={ui.field__hint}>{team.description}</p>}
            <ul className={ui.membership__list}>
              {withPeople(team.members, roster).map((person) => (
                <li key={person.member.id} className={ui.membership__row}>
                  <PersonCell
                    avatar={person.member.avatar}
                    name={fullName(person.member)}
                    caption={MEMBERSHIP_ROLE_LABELS[person.role]}
                  />
                </li>
              ))}
            </ul>
          </Panel>
        ))
      )}
    </>
  );
};

export default Page;
```

- [ ] **Step 3: Tests and type check**

Run: `bun run test && bunx next typegen && bunx tsc --noEmit`
Expected: PASS, exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/projects/ProjectCard.tsx "app/(account)/account/projects" "app/(account)/account/teams"
git commit -m "feat: show own projects and teams in the cabinet" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Verify everything

**Files:** none (verification only; fixes found here go through TDD in the owning module).

- [ ] **Step 1: Full checks**

```bash
bun run test
bun run lint
bunx next typegen && bunx tsc --noEmit
bun run build
```
Expected: tests PASS; lint 0 errors (existing `<img>` and `_prev` warnings are fine); tsc exit 0; build succeeds and lists `/account`, `/account/resume`, `/account/projects`, `/account/teams` as dynamic routes.

- [ ] **Step 2: Anonymous access**

Start `bunx next start -p 3100` in the background (port 3000 is usually the user's `next dev`):
```bash
for route in /account /account/resume /account/projects /account/teams; do
  printf '%-20s ' "$route"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "http://localhost:3100$route"
done
```
Expected: each `307 http://localhost:3100/login`. (`route`, not `path`: in zsh `path` is tied to `PATH`.)

- [ ] **Step 3: Signed in, read-only**

Sign in through the `/login` form without JS (multipart POST with the form's hidden `$ACTION_*` fields plus `login`/`password`; mark cookies non-secure for `http://localhost`, browsers do the same) with the admin account the user provided. Then GET the four cabinet routes and `/admin`.
Expected: all `200`; `/account` shows the admin's name; `/account/resume` shows the four sections; `/account/projects` and `/account/teams` show cards or their empty states; `/admin` still renders with the real name in the sidebar; no «Сервер не отвечает» on any page; the server log has no «Dropped an API row».

- [ ] **Step 4: Live write check — ask the user first**

The résumé dialogs need JavaScript, so writes are checked against the API with the exact payloads our parsers produce: with the user's permission, create, `PATCH` and `DELETE` one row of each résumé type for the admin account (admin token, `POST /personal-account/<type>/`, `PATCH`/`DELETE /personal-account/<type>/{id}/`), confirm each response parses with the Task 2 schema, and delete everything created. Do not touch the profile or the password of the admin account.

- [ ] **Step 5: Hand-off notes**

Report to the user:
- what was verified live and what wasn't: the dialogs in a browser (user's manual check: add / edit / delete in each section, «Учусь сейчас» hides the end date, mobile menu), and the password change (needs a throwaway account from the backend);
- that the résumé stays private until the backend adds it to `/members/{id}/`.
