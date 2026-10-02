# Admin dashboard — design

Date: 2026-10-02 · Source: «Motion Community — структура платформы v1» (ТЗ), §2–§13

## Goal

A working (not polished) admin area: the admin logs in with credentials from
`.env`, manages members, teams, projects and client requests, and the public
site reflects those changes. No real backend yet — a JSON file stands in for
the database behind a repository layer that will later be swapped for API
calls without touching UI.

## Out of scope

- Team Lead / Developer dashboards and member login (later; member passwords
  are already stored hashed so it can be wired without data migration).
- Project chat.
- Settings content (menu entry + placeholder page only).
- Visual polish.
- Deployment to a read-only filesystem (Vercel): the JSON store is for local /
  own-server use only.

## 1. Auth

- Env: `ADMIN_LOGIN`, `ADMIN_PASSWORD`, `AUTH_SECRET` (all in `.env`, gitignored).
- `login` Server Action (`src/actions/auth.ts`, replaces the stub):
  validates input with zod, compares against env using a constant-time
  comparison of SHA-256 digests. Success → session cookie → `redirect("/admin")`.
  Failure → `{ error: "Неверный логин или пароль." }`.
- Session cookie `mc_session`: `base64url(JSON payload) + "." + base64url(HMAC-SHA256)`.
  Payload `{ sub: "admin", role: "ADMIN", exp }`, TTL 8h.
  Flags: `httpOnly`, `sameSite: "lax"`, `secure` in production, `path: "/"`.
  Signing/verification via Web Crypto (`crypto.subtle`) — works in Proxy and
  in the Node runtime, no new dependency.
- `src/server/auth/session.ts`: `createSession`, `readSession`, `deleteSession`.
- `src/server/auth/dal.ts`: `requireAdmin()` (React `cache`d) — redirects to
  `/login` when the session is missing/invalid/expired or role ≠ ADMIN.
  Called in the admin layout, every admin page, and every admin Server Action.
- `proxy.ts` (project root, Next 16 replacement for middleware): optimistic
  check on `/admin/:path*` → redirect to `/login` without a valid cookie;
  on `/login` with a valid admin cookie → redirect to `/admin`.
- `logout` Server Action deletes the cookie and redirects to `/login`.

## 2. Data

Store: `data/db.json` (gitignored). If missing, it is created from a seed
built from the current `src/data/*` mocks.

```
User          { id, login, passwordHash, role: ADMIN|TEAM_LEAD|DEVELOPER, status: ACTIVE|INACTIVE, createdAt }
MemberProfile { id, userId, firstName, lastName, photo, bio, specializationId, roleTitle, stack,
                skills[], github?, linkedin?, portfolio?, resume?, experience[], education[] }
Team          { id, name, description, createdAt }
TeamMember    { teamId, userId, role: TEAM_LEAD|DEVELOPER }
Project       { id(slug), name, description, details, status, category, origin, year, image,
                stack[], demoUrl?, githubUrl?, featured, createdAt }
ProjectMember { projectId, userId, role: TEAM_LEAD|DEVELOPER }
ClientRequest { id, name, company?, email, phone?, title, description, projectType?, budget?,
                status: NEW|REVIEWING|ACCEPTED|IN_PROGRESS|COMPLETED|REJECTED, createdAt }
```

- The admin account is not stored in the DB; it comes from `.env`.
- Seed: each mock member → User (DEVELOPER or TEAM_LEAD by role title,
  login = member id, random password hash) + MemberProfile; each mock team →
  Team («Команда {projectName}») + TeamMembers and ProjectMembers for the
  matching project. Seed client requests: none.
- `src/server/db/store.ts`: `readDb()`, `mutateDb(fn)` — writes are
  serialized through a promise queue and written atomically (temp file +
  rename). IO errors are logged and rethrown as a typed `StoreError`.
- Repositories `src/server/repositories/{members,teams,projects,requests}.ts`
  expose domain functions (list/get/create/update/setStatus/addMember/…);
  UI and actions never touch the store directly.
- Passwords: `scrypt` (node:crypto) with random salt, stored as `salt:hash`.
- Public site reads through repositories: `/team`, `/team/[id]`,
  `/projects`, `/projects/[slug]`, homepage sections that list projects/members.
  These become dynamically rendered. `INACTIVE` members stay hidden.
- `/contact` form submits a `createClientRequest` Server Action (zod
  validation, field errors shown inline, success state kept).

## 3. Admin UI

Route group `app/(admin)/admin/…`, own layout (no site header/footer):
sidebar (Обзор, Участники, Команды, Проекты, Заявки, Настройки, Выйти);
on < 960px the sidebar becomes a top bar with a menu toggle.

| Route | Content |
|---|---|
| `/admin` | counts (members active/inactive, teams, projects by status, new requests) + latest NEW requests |
| `/admin/members` | table; search by name/login; filters role, status |
| `/admin/members/new` | login, password (+ generate), role, first/last name, specialization, role title, stack, bio, skills |
| `/admin/members/[id]` | edit profile + role; reset password; activate/deactivate |
| `/admin/teams`, `/new`, `/[id]` | list; create/edit name+description; members: add (user + role), change role, remove |
| `/admin/projects`, `/new`, `/[id]` | list with status; create/edit all fields; members: add (user + role), change role, remove |
| `/admin/requests`, `/[id]` | list with status filter; detail; change status |
| `/admin/settings` | placeholder |

- Mutations: Server Actions + `useActionState`, zod schemas in
  `src/server/validation/*`, `revalidatePath` for admin and affected public
  routes. Field errors under fields; generic error in `role="alert"`.
- Destructive-ish actions (deactivate, remove from team/project) use a
  confirm step.
- Visual language: existing dark tokens, dense tables, no motion beyond
  existing button feedback.

## 4. Errors

Every action: `requireAdmin()` → zod parse → repository call in try/catch.
Validation → `{ fieldErrors }`; not found → `{ error }`; store failure →
logged with `console.error`, user sees «Не удалось сохранить. Попробуйте ещё раз.»

## 5. Verification

No test framework in the repo. Verification = `bun run build`, `bun run lint`
(no new problems), and a Playwright script:
1. `/admin` without cookie → `/login`.
2. Wrong password → error; correct → `/admin`.
3. Create member → appears in `/admin/members` and on `/team`.
4. Add member to a project as DEVELOPER → visible on `/projects/[slug]` and profile.
5. Deactivate member → hidden on `/team`, profile 404.
6. Submit `/contact` → request visible in `/admin/requests`; change status persists after reload.
7. Logout → `/admin` redirects to `/login`.
