# API integration — design

Date: 2026-10-08 · Source: Motion Community API docs at `$API_URL/docs/` (the server address lives only in `.env`)
(drf-yasg, Swagger 2.0; raw schema at `?format=openapi`)

## Goal

Replace the local JSON store and the `.env` admin login with the real Django
REST API. The API docs are the single source of truth: every screen shows only
what the API provides, and features the API lacks are removed, not emulated.

This is spec 1 of 2. Spec 2 is the member cabinet (`/account`: own profile,
work experience, education, languages, certificates).

## Decisions made while brainstorming

- **Strictly by API.** Removed: client request statuses beyond `New`/`Reviewing`,
  member notifications, the project fields stack/year/origin/details/featured,
  the AI/ML specialization, and the résumé on the public profile. Backend
  problems are collected in `docs/backend-issues.md`. Screens blocked by the
  backend show an explanatory state instead of failing.
- **Server-only data layer.** A hand-written typed client plus zod. Only the
  Next server talks to the API; the browser never sees tokens or the API URL.
- **Two specs.** This one covers the foundation, auth, public site and admin.
  The cabinet comes next.

## Out of scope

- The member cabinet beyond a placeholder page (spec 2).
- RU/EN switching. The API base is `/ru`.
- File uploads. The API has none; image and file fields are read-only.
- Backend fixes. They are listed in `docs/backend-issues.md`.
- Visual redesign. Only the changes needed to show API data, including
  fallbacks for missing images.

## Unverified assumptions (no test accounts yet)

1. `POST /auth/login/` returns `{ access, refresh }` (simplejwt pair). The
   Swagger response schema just repeats the request.
2. `POST /auth/login/refresh/ { refresh }` returns `{ access }` and possibly a
   rotated `refresh`.
3. `POST /auth/logout/` accepts `{ refresh }` with a Bearer header.
4. `GET /personal-account/` with a valid token returns the caller's `id`,
   `role` and `status`.
5. An Admin token may `PATCH /members/{id}/` (status) for other users.
6. An Admin token is accepted by `/teams/*`, `/client-requests/*`,
   `/admin/members/*` and the membership sub-routes.

If one of these turns out wrong, only `src/server/api/auth.ts` (1–4) or the
matching resource module (5–6) changes.

## 1. Foundation

### Modules

- `src/server/api/http.ts`: `request()`.
  - Builds `API_URL + path`, sends JSON and an optional Bearer token.
  - Uses `redirect: "manual"` and a 10 s timeout (`AbortSignal.timeout`).
  - Parses errors and validates the response body with the endpoint's zod schema.
  - Has no `server-only` or `next/headers` imports, so `proxy.ts` can use it.
- `src/server/api/client.ts` (`server-only`): the wrappers pages and actions use.
  - Public GETs get `next: { revalidate: 60, tags }`.
  - Authenticated calls read `mc_access` through `cookies()` and use
    `cache: "no-store"`.
  - An `unauthorized` error becomes `redirect("/login")`.
- `src/server/api/errors.ts`: `ApiError { kind, status, detail?, fieldErrors? }`.
  - `unavailable`: network failure, timeout, 5xx.
  - `unauthorized` (401), `forbidden` (403), `not_found` (404).
  - `validation` (400): DRF `{ field: string[] }` becomes `fieldErrors`.
    `detail` and `non_field_errors` become the form-level message.
  - `redirected` (3xx): the endpoint is blocked (today `/admin/members/`).
  - `bad_response`: not JSON, or zod rejected it. The zod issues are logged.
- `src/server/api/schemas.ts`: zod schemas for every model in the docs,
  corrected to observed responses:
  - `ProjectDetail.members` and `TeamDetail.members` are
    `{ id, project | team, user, role }[]`, with user ids only.
  - `MemberProfileDetail.projects` is `ProjectList[]`.
  - Stats is `{ members_count, projects_count, companies_count }`.
  - Tokens is `{ access, refresh? }`.

  Objects are non-strict (unknown keys stripped), so new backend fields don't
  break pages.
- Resource modules: `stats.ts`, `members.ts`, `projects.ts`, `teams.ts`,
  `client-requests.ts`, `admin-members.ts`, `auth.ts`. One function per endpoint
  used. Ids are numbers.
- `src/server/api/joins.ts`: pure helpers.
  - Attach roster people to memberships.
  - Find projects without a lead.
  - Find idle members.
  - Split skills into chips.
- `src/lib/api-labels.ts`: Russian labels and badge tones for positions,
  project statuses, user roles, membership roles, user statuses and request
  statuses.
  - It is shared, not `server-only`, because client components such as the
    `/projects` filters need it.
  - It replaces the label maps in `src/data/projects.ts` and the enum maps in
    `src/components/admin/labels.ts`, which keeps only `formatDate` and
    admin-only helpers.

New files follow the repo's existing naming: PascalCase for components in
`src/components`, kebab-case for everything else.

### Env

- `API_URL` (the API's `/ru` base): server-only, no `NEXT_PUBLIC_` prefix. The value lives only in the local `.env`, never in committed files.
- `AUTH_SECRET`: kept, signs `mc_session`.
- `.env.example`: committed with empty values. `.gitignore` gets `!.env.example`.

### Caching

- Public GETs are cached with `revalidate: 60` and a tag: `/stats/` → `stats`,
  `/members/` and `/members/{id}/` → `members`, `/projects/` and
  `/projects/{id}/` → `projects`. They are never sent with a token.
- Everything sent with a token uses `cache: "no-store"`.
- Admin pages call every endpoint, public ones included, through the
  authenticated wrapper, so the admin always sees fresh data.
- Server Actions that can change public data call `updateTag` for `members`,
  `projects` and `stats`. Updating all three is cheap and always correct.
- Admin actions also keep `revalidatePath("/admin", "layout")` for the admin
  views.
- Edits made directly in the Django admin appear on the site within 60 s.

### Errors in pages and forms

- `not_found` → `notFound()`. `unauthorized` → `redirect("/login")`.
- Everything else goes to the existing `error.tsx` boundaries. The `LoadError`
  copy becomes «Сервер не отвечает. Попробуйте ещё раз через минуту.»
- Form input names equal API field names, so `fieldErrors` map 1:1 onto fields.
  `detail` becomes the form error.
- Route ids must be positive integers. Anything else → `notFound()`.

## 2. Auth

### Cookies

All three cookies are httpOnly, `sameSite: "lax"`, `secure` in production,
`path: "/"`.

- `mc_access` and `mc_refresh`: the backend JWTs. Each cookie's `maxAge` comes
  from its token's `exp`. The payload is read without verification; the backend
  verifies.
- `mc_session`: the existing HMAC-signed token from `session-token.ts`.
  - Payload `{ sub: userId, role: "Admin" | "Team_Lead" | "Developer", exp }`.
  - `exp` is the refresh token's exp.
  - It lets proxy and pages know the role without an API call. The backend
    stays the real authority.

### Login (`src/actions/auth.ts`, form UI unchanged)

1. Existing field validation.
2. `POST /auth/login/ { username, password }`.
   - 401 → «Неверный логин или пароль.»
   - `unavailable` → «Сервер недоступен, попробуйте позже.»
3. `GET /personal-account/` with the new access token gives `{ id, role, status }`.
   The schema requires a numeric `id`, which guards against the anonymous-200
   quirk.
4. `status === "Inactive"` → «Аккаунт отключён. Обратитесь к администратору.»
   No cookies are set.
5. Set the three cookies. Redirect Admin → `/admin`, Team_Lead and Developer →
   `/account`.

### `/account` placeholder

- Files: `app/(account)/layout.tsx` (minimal, like `(auth)`) and
  `app/(account)/account/page.tsx`.
- The page greets the user by name from `/personal-account/`, says «Личный
  кабинет скоро появится» and has a logout button.
- Any signed-in role may open it.
- Fix the stale `/dashboard` comment in `app/(auth)/layout.tsx`.

### `proxy.ts`

Matcher: `/admin/:path*`, `/account/:path*`, `/login`.

1. **Refresh.** If `mc_access` is missing or expires in under 30 s, and
   `mc_refresh` exists, call `POST /auth/login/refresh/`.
   - Success: write the new cookies to the response and to the forwarded
     request, so this render already uses them. If the refresh token rotated,
     re-sign `mc_session` with its new `exp`.
   - 401: clear all three cookies.
   - Network failure: leave the cookies; the page shows its error state.
2. **Role check (optimistic).** `/admin/*` needs a valid `mc_session` with
   role `Admin`; `/account/*` needs any valid session. Otherwise redirect to
   `/login`.
3. **`/login` with a session.** Call `GET /auth/verify/` with the (possibly
   refreshed) access token.
   - 200 → redirect to the role's home.
   - 401 → clear the cookies and render the login page.

   This breaks the loop where a revoked token makes a page redirect to `/login`
   and proxy sends the user straight back.

The decision logic lives in a pure function in
`src/server/auth/proxy-decision.ts` so it can be unit-tested. `proxy.ts` only
does the fetches and cookie writes. Check the Next 16 proxy docs for the
request-cookie forwarding pattern before implementing.

### Server guards

- `requireRole(...roles)` (wrapped in React `cache`) replaces `requireAdmin`
  in every admin layout, page and Server Action, and guards `/account`.
- A 401 from the API during render redirects to `/login`.

### Logout

`POST /auth/logout/ { refresh }` with the Bearer token. The result is ignored;
the cookies are cleared and the user is redirected to `/login`.

## 3. Public site

### Shared fallbacks

- `ProjectCover`: shows `preview_image`, or a gradient in the site palette with
  the project name. Every project in the API currently has no image.
- Member avatars: show `avatar`, or initials on a tinted circle.

### Home `/`

- **Stats:** `GET /stats/` → «участников», «проектов», «компаний» (replaces
  «наймов»). Exact numbers, no "+". The count-up animation stays.
- **Portfolio:** `GET /projects/`, in API order. Each card shows name, category,
  status and `ProjectCover`. No description or year: the list endpoint has
  neither.
- Other sections stay static and unchanged.

### `/projects`

- `GET /projects/`. Cards as on the home page.
- The «Свои / На заказ» tabs (origin) become category tabs: «Все» plus the
  distinct `category` values from the data.
- The status filter keeps its 4 statuses, which match the API enum.
- Filtering stays client-side. The list is small, so the API's `?category`,
  `?project_status` and `?search` aren't needed yet.

### `/projects/[id]` (folder renamed from `[slug]`)

- `GET /projects/{id}/`: name, description, status, category, year (from
  `created_at`), demo and GitHub links, cover.
- **Team:** project `members` joined with the cached `GET /members/` roster.
  Leads first. Each person shows name, position label and avatar, and links to
  `/team/{id}`. Users missing from the roster are skipped.
- Prev/next follows the `GET /projects/` order, wrapping around as now.
- Removed: details, stack, origin.

### `/team`

- **Roster:** `GET /members/` → name, position label, avatar.
- **Specializations:** the 6 API positions. Each keeps its static copy, keyed
  by API value in `src/data/specializations.ts`, and shows a member count from
  the roster. AI/ML is removed.
- **«Команды по проектам»:** `/teams/` needs auth, so this section is built
  from `GET /projects/{id}/` for every project (parallel, cached). Projects with
  no members are skipped. The N+1 is listed in `docs/backend-issues.md`.

### `/team/[id]`

- `GET /members/{id}/`. 404 if it is missing or `Inactive`.
- **Profile card:** name, position label, bio, skill chips (split on commas and
  newlines, trimmed, empties dropped), GitHub/LinkedIn/portfolio/résumé links
  when present, avatar.
- **Projects:** `member.projects` (name, status, category, cover). No role: the
  API doesn't provide it.
- The résumé timeline section and its component are removed.

### `/about`

- «Услуги» stays static but loses the per-service project lists and counts:
  API categories are free text and don't match the services.
- `About` no longer fetches projects.

### `/contact`

The form posts to `POST /client-requests/`. Field names equal API names.

| Field | Rule |
|---|---|
| `name` | required, 2–150 |
| `company` | required, ≤150 (was optional) |
| `email` | required, valid email, ≤254 |
| `phone` | required, ≤128 (was optional) |
| `title` | required, 2–150 |
| `description` | required, 10–2000 (existing UX limits) |
| `project_type` | required. One of the 4 current options + «Другое», sent as the Russian label |
| `budget` | optional, integer ≥ 0, in som; empty → `null` |

- The success state is unchanged.
- DRF errors map onto fields.
- The action calls `updateTag("stats")`, since `companies_count` may change.

## 4. Admin

### Layout and nav

- Counts:
  - active members from the public `GET /members/` (so a broken
    `/admin/members/` doesn't take the whole admin down);
  - teams from `GET /teams/`;
  - projects from `GET /projects/`;
  - new requests from `GET /client-requests/` filtered to `New`.
- The «Настройки» page and nav item are removed.

### Overview

- The funnel has 2 statuses: `New` and `Reviewing`.
- «Требует внимания» lists new requests, unfinished projects without a lead,
  and active members in no project.
- «Проекты в работе» shows the lead and avatars.
- All of this is computed from project details (parallel) plus the roster. No
  per-member requests.

### Members `/admin/members/*`

- **List:** `GET /admin/members/` (login, role, status), joined by id with the
  roster for name and position. People missing from the roster show their
  login. The existing filters stay: search by name or login, role, status.
- **New:** login, password (with the existing generate button) and role →
  `POST /admin/members/`. Then redirect to the detail page with the existing
  `?created=1` notice, which shows the password once.
- **Detail:** `GET /admin/members/{id}/`, plus the member's projects from
  `GET /members/{id}/` (a 404 there is ignored). It shows login, role, status,
  `created_at`, name, position, bio, skills, links, avatar and the résumé link.
  - **Edit dialog:** login, first/last name, position, bio, skills, GitHub,
    LinkedIn, portfolio → `PATCH /admin/members/{id}/`. The notification
    warning is removed.
  - **Role select:** `PATCH /admin/members/{id}/ { role }`.
  - **Reset password:** `PATCH /admin/members/{id}/ { password }` with a
    generated password, shown once.
  - **Activate / deactivate:** `PATCH /members/{id}/ { status }`. In the admin
    schema `status` is read-only.
  - **New: delete.** `DELETE /admin/members/{id}/` after confirmation, then
    redirect to the list.
- **Blocked state:** while `/admin/members/` answers `redirected`, the three
  member pages render a panel: «Раздел недоступен. Бэкенд перенаправляет
  /admin/members/ на вход в Django-админку — нужна правка на стороне бэкенда.»
  The rest of the admin keeps working.

### Teams `/admin/teams/*`

- **List:** `GET /teams/` → name plus image or initial.
- **New and edit:** `team_name` and `description` → `POST` / `PATCH /teams/{id}/`.
- **New: delete** with confirmation.
- **Members:** `GET /teams/{id}/members/`, joined with the roster.
  - Add: a member select (roster minus current members) and a role select →
    `POST`.
  - Remove: `DELETE /teams/{id}/members/{userId}/`.
  - Rows show the role as a badge. There's no inline role change because the
    API has no PATCH for it; to change a role, remove and re-add.

### Projects `/admin/projects/*`

- **List:** `GET /projects/` plus details (parallel, `no-store`) → card with
  name, category, status, lead and avatars.
- **Form:** `name`, `description`, `project_status`, `category`, `demo_url`,
  `github_url`. Category is a text input with a datalist of existing
  categories. Create, edit, and **new: delete** with confirmation.
- **Members:** same editor as teams, on `/projects/{id}/members/`.

### Requests `/admin/requests/*`

- **Board:** two columns (`New`, `Reviewing`) from `GET /client-requests/`.
- **Detail:** all fields from `GET /client-requests/{id}/`.
- **Status form:** 2 options → `PATCH { status }`. The API has no delete.

## 5. Removed

- **JSON store:** `src/server/db/*`, `src/server/repositories/*`,
  `src/server/queries/public.ts`, their tests, and `/data/` in `.gitignore`.
- **Mocks:** `src/data/members.ts`, `projects.ts`, `teams.ts`, `stats.ts`.
  Static marketing data stays: services, testimonials, milestones, socials,
  community photo, and specialization copy.
- **Features the API lacks:**
  - notifications;
  - request statuses beyond `New`/`Reviewing`;
  - the settings page;
  - `ResumeTimeline`;
  - `hashPassword`/`verifyPassword` (`generatePassword` stays);
  - `ADMIN_LOGIN`/`ADMIN_PASSWORD` handling.
- **Dead client code:** `src/api/index.ts`, `orval.config.ts`,
  `src/provider/Provider.tsx`, and the dependencies `@tanstack/react-query`,
  `@tanstack/react-query-devtools`, `@tanstack/react-devtools`,
  `tanstack-query` and `orval`.

## 6. Tests (vitest)

- **`http.ts` request**, with a mocked `fetch`:
  - success with zod parsing;
  - DRF 400 → `fieldErrors`;
  - 401, 403, 404;
  - 3xx → `redirected`;
  - timeout and network failure → `unavailable`;
  - non-JSON and schema mismatch → `bad_response`;
  - Bearer only when a token is passed.
- **Auth:**
  - JWT `exp` reading;
  - cookie lifetimes;
  - `proxy-decision` (path + session + token state → continue, refresh,
    verify or redirect).
- **Form schemas:** contact, member, team and project schemas against the API
  constraints. The existing validation tests are rewritten.
- **`joins.ts`:**
  - project team assembly;
  - projects without a lead;
  - idle members;
  - skills splitting.

## 7. Verification

- `bun run test`, `bun run lint` and `bun run build` pass.
- **Dev server against the live API:**
  - `/`, `/projects`, `/projects/1`, `/team`, `/team/2` and `/about` render API
    data.
  - `/team/9999` and `/projects/abc` → 404.
  - `/contact` with an empty submit shows field errors.
  - A real request is submitted only with the user's permission, since it
    lands in the backend's database.
- **Manual checklist once test accounts exist:**
  1. Admin login → `/admin`. A wrong password shows the error. An inactive
     account is refused.
  2. Team_Lead/Developer login → `/account`. Opening `/admin` redirects to
     `/login`.
  3. Delete `mc_access` → the next navigation refreshes it silently.
  4. Logout clears the cookies; `/admin` then redirects to `/login`.
  5. After backend issue #1 is fixed, members:
     - create, then log in with the shown password;
     - edit the profile, change the role, reset the password;
     - deactivate and activate, delete.
  6. Teams and projects: create, edit, delete; add and remove members. Public
     pages reflect the changes immediately.
  7. A contact form submission appears under `New`, and can be moved to
     `Reviewing`.
