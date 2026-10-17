# Member cabinet — design

Date: 2026-10-09 · Source: Motion Community API docs at `$API_URL/docs/` (the server address lives only in `.env`) · Platform spec: «Motion Community — структура платформы v1», section 2 (Developer) and 10 (Dashboard)

## Goal

Replace the `/account` placeholder with a working cabinet where a signed-in
member keeps their own profile and résumé and sees their projects and teams.
This is spec 2 of the API integration; spec 1 is
`docs/superpowers/specs/2026-10-08-api-integration-design.md` and everything it
set up (server-only data layer, zod, JWT cookies, `requireRole`, error mapping)
is reused as is.

## Decisions made while brainstorming

- **Scope:** profile, résumé (work, education, languages, certificates), «Мои
  проекты», «Мои команды». No chats (the API has none).
- **Look:** like the admin — sidebar menu and the admin UI kit (Panel, Field,
  FormActions, ConfirmButton, native `<dialog>`). The UI is a demo for checking
  logic: no bespoke styling or motion polish.
- **Résumé editing:** cards per section; «Добавить» and «Изменить» open a dialog
  with the form; «Удалить» asks for confirmation.
- **Architecture:** server-first, as in the admin — Server Components, Server
  Actions, zod. Only the dialogs and forms are client components. One typed
  factory serves the four résumé resources; each resource keeps its own form
  and schema (no form generator).

## Out of scope

- Chats, file uploads (`avatar`, `resume`, `certificate_image` are read-only in
  the API), deleting one's own account (the platform spec says users are not
  deleted physically), changing one's role or login, Team Lead managing project
  members, showing the résumé on the public profile (the API doesn't expose it).

## Unverified assumptions

1. `PATCH /personal-account/ { password }` hashes the password (login keeps
   working with the new one). Checked only on a throwaway account; until then
   the feature is marked unverified.
2. `/personal-account/{work,education,languages,certificates}/` list only the
   caller's own rows and `PATCH`/`DELETE` on `{id}/` refuse other people's rows.
3. A Developer token may read `/teams/` and `/teams/{id}/` (verified
   2026-10-09 with a Developer account).

## Endpoints

Used (17): `PATCH /personal-account/`; for each of `work`, `education`,
`languages`, `certificates`: `GET` list, `POST`, `PATCH {id}/`, `DELETE {id}/`.
`GET /personal-account/` is already used.

Skipped on purpose (9): `DELETE /personal-account/`; `GET {id}/` and `PUT {id}/`
of the four résumé resources (the list and `PATCH` cover them).

## 1. Shared dashboard shell

- `src/components/dashboard/DashboardShell.tsx` and `DashboardNav.tsx` take
  the brand label, the home href, the nav links and the signed-in person
  (name, caption) as props. Styles move with them (`DashboardShell.module.scss`,
  the former `AdminShell.module.scss`).
- `AdminShell`/`AdminNav` become thin wrappers that pass the admin links and
  counts. The admin looks the same; its account block shows the real name from
  `/personal-account/` instead of the hard-coded «Админ».

## 2. Routes and guards

```
app/(account)/layout.tsx            metadata only, no <main> (the shell renders it)
app/(account)/account/layout.tsx    requireRole() + getMyProfile() → DashboardShell
app/(account)/account/page.tsx      /account           Профиль
app/(account)/account/resume/page.tsx    /account/resume    Резюме
app/(account)/account/projects/page.tsx  /account/projects  Мои проекты
app/(account)/account/teams/page.tsx     /account/teams     Мои команды
app/(account)/error.tsx             LoadError, as in the site and admin groups
```

- Any signed-in role may open the cabinet (proxy already allows it). Every page
  and every Server Action calls `requireRole()`.
- Nav: Профиль · Резюме · Мои проекты · Мои команды; an Admin also gets
  «Админка» → `/admin`. Bottom block: name, position label, logout.
- `AccountPlaceholder` and its styles are deleted.

## 3. Data layer

### `src/server/api/account.ts`

- `getMyProfile()` (React `cache`, `GET /personal-account/`) with
  `myProfileSchema`: `accountSchema` plus `created_at`, `avatar` (media), `bio`,
  `position` (nullable, unknown → null), `skills`, `github`, `linkedin`,
  `portfolio`, `resume` (media). `getMyAccount` stays as an alias for callers
  that only need id/role/status.
- `updateMyProfile(patch: ProfilePatch)` → `PATCH /personal-account/`.
  `ProfilePatch` has only `first_name`, `last_name`, `position?`, `bio`,
  `skills`, `github`, `linkedin`, `portfolio`. The type has no `role` or
  `login`, so they can't be sent.
- `changeMyPassword(password)` → `PATCH /personal-account/ { password }`.
- `resumeResource(path, schema)` returns `{ list, create, update, remove }`
  (`list` is `cache`d, uses `listOf`). Instances: `workResource`,
  `educationResource`, `languageResource`, `certificateResource`.

### Schemas (`schemas.ts`)

| Schema | Fields |
|---|---|
| `workSchema` | `id`, `company`, `position`, `start_time`, `end_time` (nullable), `working_format` (enum, unknown → null), `achievements` |
| `educationSchema` | `id`, `educational_institution`, `specialization`, `start_year`, `end_year` (nullable), `studying_now`, `responsibilities` |
| `languageSchema` | `id`, `languages`, `Level` (enum, unknown → null) |
| `certificateSchema` | `id`, `title`, `organization`, `given_date`, `text`, `certificate_image` (media) |

Enums go to `src/lib/api-enums.ts`: `WORKING_FORMATS`
(`office`, `remote`, `hybrid`, `freelance`, `part_time`, `full_time`,
`contract`, `internship`, `flexible`) and `LANGUAGE_LEVELS`
(`A1`…`C2`, `Родной язык`). Russian labels go to `src/lib/api-labels.ts`
(Офис, Удалённо, Гибрид, Фриланс, Частичная занятость, Полная занятость,
Контракт, Стажировка, Гибкий график).

### Form validation (`src/server/validation/account.ts`)

Input names equal API field names.

| Form | Rules |
|---|---|
| profile | `first_name`, `last_name` 1–150; `position` one of `POSITIONS`, blank = leave unchanged; `bio` ≤ 2000; `skills` ≤ 500; `github`, `linkedin`, `portfolio` URL ≤ 200, blank → `null` |
| password | `password` 8–64; `password_repeat` must match; only `password` is sent |
| work | `company`, `position` 1–150; `start_time` date; `end_time` date or blank → `null`, not before `start_time`; `working_format` one of the enum or blank → omitted; `achievements` 1–2000 |
| education | `educational_institution`, `specialization` 1–150; `start_year` date; `studying_now` checkbox → boolean; `end_year` date or blank → `null`, forced `null` when `studying_now`, not before `start_year`; `responsibilities` 1–2000 |
| language | `languages` 1–150; `Level` one of `LANGUAGE_LEVELS` (required in our form) |
| certificate | `title`, `organization` 1–150; `given_date` date; `text` 1–2000 |

Dates are `YYYY-MM-DD` (`<input type="date">`).

### Server Actions (`src/actions/account/`)

- `profile.ts`: `updateProfileAction`, `changePasswordAction`.
- `resume.ts`: create/update/delete for each résumé resource; ids are bound
  server-side with `.bind`.
- Every action: `requireRole()`, parse, call, `toFormError`/`toActionError` on
  failure (moved from `actions/admin/` to `src/actions/handle-error.ts` and
  `form-state.ts` so both areas share them).
- On success: `revalidatePath("/account", "layout")`; profile changes also
  `updateTag("members")` so `/team/[id]` shows them at once.

### Joins (`joins.ts`)

- `myProjects(projects, userId)`: projects where the user is a member, with
  their membership role. Built from `getProjectsWithMembers()`, so it works
  for an Admin without a public profile.
- `myTeams(teams, userId)`: teams (details from `getTeam`) where the user is a
  member, with their role.

## 4. Screens

All built from the admin UI kit.

- **`/account`**: header with name and «position · role»; «Публичный профиль ↗»
  → `/team/{id}` for Active non-admins. Panel «Профиль»: the admin
  `MemberProfileForm` with a `showLogin={false}` option. Panel «Доступ»: login,
  role, status, created date (read-only) and the «Сменить пароль» form
  (password + repeat). Hint: photo and PDF résumé are set by the admin for now.
- **`/account/resume`**: note «Резюме пока видно только вам». Four panels
  (Опыт работы, Образование, Языки, Сертификаты), each a card list plus
  «Добавить». Cards: work «должность · компания», «янв 2024 — сейчас», format,
  achievements; education «специализация · учебное заведение», «2019 — 2023» or
  «2021 — учусь»; language «Английский — B2»; certificate «название ·
  организация», date, text. Each card: «Изменить» (dialog with filled form),
  «Удалить» (ConfirmButton). Empty: «Пока пусто — добавьте первую запись.»
  Work, education and certificates sort newest first.
- **`/account/projects`**: the admin `ProjectCard` with an `href` prop
  (public `/projects/{id}`) and the member's role badge. Empty: «Вас пока не
  добавили ни в один проект.»
- **`/account/teams`**: panel per team: name, description, own role, members
  with avatars and roles. Empty: «Вы пока не состоите ни в одной команде.»
- One client `ResumeItemDialog` (trigger, title, form as children, closes on
  success) wraps the four forms (`WorkForm`, `EducationForm`, `LanguageForm`,
  `CertificateForm`), each on `useActionState`.

## 5. Errors

- Load failure → `app/(account)/error.tsx` (LoadError «Сервер не отвечает…»).
- 401 → `/login` (existing client wrapper).
- Form errors under fields; anything else above the submit button.
- `toFormError`: DRF field errors whose keys the form may not have now always
  come with the form message «Проверьте поля формы.» (also fixes the admin
  forms; deferred minor from spec 1).
- Pending: submit disabled, «Сохраняем…». Success: dialog closes, profile form
  shows «Сохранено».

## 6. Tests (vitest, failing test first)

- Validation: every rule in the table above (dates order, `studying_now`,
  password repeat, URL blank → null, enums).
- `account.ts`: path, method and body for each of the 17 endpoints (client
  mocked); schemas parse real-shaped rows including `Level`.
- Joins: `myProjects`, `myTeams` filter by id and carry the role.
- Actions: password mismatch never calls the API; the profile action never
  sends `role`/`login`; success revalidates.
- `toFormError`: an unknown DRF field key yields «Проверьте поля формы.».

## 7. Verification

- `bun run test`, `bun run lint`, `bunx next typegen && bunx tsc --noEmit`,
  `bun run build`.
- Production build, live API:
  1. Anonymous `/account/*` → `/login`.
  2. Admin session, read-only: the four pages render API data.
  3. With the user's permission: add, edit and delete one row of each résumé
     type on the admin's own (non-public) résumé, then remove them.
  4. Password change only on a throwaway account from the backend.
