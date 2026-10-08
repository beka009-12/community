# API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Motion Community frontend off the local JSON store and the `.env` admin login onto the Django REST API at `API_URL`, showing only what that API provides.

**Architecture:**
- A server-only data layer in `src/server/api/`, with three levels:
  - `http.ts`: the fetch core (errors, timeout, zod validation);
  - `client.ts`: public cached and token-authed wrappers;
  - one module per resource.
- Backend JWTs live in httpOnly cookies. `proxy.ts` refreshes them and does optimistic role redirects; `requireRole()` guards pages and actions.
- Public pages render per request on top of a 60 s tagged data cache. Admin Server Actions `updateTag` the public tags.
- The old store, repositories and mocks stay untouched until the final cleanup task, so every task leaves tests and types green.

**Tech Stack:** Next.js 16.3 (App Router, `proxy.ts`, Server Actions, `updateTag`), React 19.2, TypeScript strict, zod 4, vitest 5, SCSS modules, bun.

**Spec:** `docs/superpowers/specs/2026-10-08-api-integration-design.md`

## Global Constraints

**API and cookies**
- API base comes from `API_URL` (`.env`, server-only, never `NEXT_PUBLIC_`). The server address never appears in committed files: code, tests, `.env.example` and docs refer to `API_URL` only.
- Cookies are `mc_access`, `mc_refresh` and `mc_session`: httpOnly, `sameSite: "lax"`, `secure` when `NODE_ENV === "production"`, `path: "/"`. Each expires at its token's `exp`.

**Caching**
- Public GETs use `revalidate: 60` plus one tag (`members` | `projects` | `stats`) and are never sent with a token. Calls with a token use `cache: "no-store"`.
- Every admin Server Action that changes data calls `refreshAfterAdminChange()` (Task 17), which runs `updateTag` on all three public tags plus `revalidatePath("/admin", "layout")`.

**Data shapes**
- Form input names equal API field names (`team_name`, `project_status`, `user`, `project_type`…), so DRF field errors map 1:1.
- Enum values are exactly what the API sends (`Team_Lead`, `In_progress`, `UI/UX_Designer`, `New`…), always imported from `src/lib/api-enums.ts`.

**Code style**
- No `any`, no `@ts-ignore`. `async/await` only. Interfaces or types for every props object, state and API shape.
- Naming: components `PascalCase.tsx` (as in `src/components`, `src/ui`), every other module `kebab-case.ts`.
- `redirect()`, `notFound()` and `unstable_rethrow` follow the Next rules. Never call them inside a `try` whose `catch` swallows them. Catch blocks that may see them call `unstable_rethrow(error)` first (`toFormError` / `toActionError` do this).
- Before writing Next-specific code (proxy, cookies, `fetch` options, `updateTag`, `useActionState`), check `node_modules/next/dist/docs/`: this Next version differs from training data.

**Copy and commits**
- User-facing copy in Russian.
- Commits in English Conventional Commits, each ending with:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

**Transition rules**
- Untouched until Task 21, and never imported by new code:
  - `src/server/db/*`, `src/server/repositories/*`, `src/server/queries/public.ts`;
  - `src/data/{members,projects,teams,stats,specializations}.ts`;
  - the enum maps in `src/components/admin/labels.ts`.
- Deviation from the spec: `src/components/team-sections/Specializations.tsx` turned out to be dead code (no page renders it). Task 13 deletes it instead of adding per-position member counts, and `src/data/specializations.ts` is deleted in Task 21 instead of being rewritten. Positions get their labels from `src/lib/api-labels.ts`.
- Deviation from the spec: `src/server/api/joins.ts` holds the data joins; the display helpers `fullName` and `initials` live in `src/lib/people.ts`, because client components need them.

**Type checks**
- `bunx next typegen && bunx tsc --noEmit` is the type check after every task. Typegen creates the `PageProps` route types.

## Review Focus

1. **API down or slow.** Public pages show the error boundary («Сервер не отвечает…» + retry) instead of hanging. Timeouts become `unavailable`. (Task 2 test «turns network failures and timeouts into unavailable»)
2. **Expired access token, valid refresh.** Proxy refreshes and the same request renders with the new token. A rejected refresh clears the cookies and redirects to `/login`. (Task 8 tests «refreshes an expired access token» and «drops a session whose refresh is rejected»)
3. **Revoked but unexpired token on `/login`.** `/auth/verify/` returns 401 → cookies cleared, form shown, no redirect loop. (Task 8 test «shows the form when the token was revoked»)
4. **Blank or unexpected backend values** (`position: ""`, `""`/`null` URLs, extra keys). Pages render with fallbacks; only a missing required field becomes `bad_response`. (Task 3 tests)
5. **`/admin/members/` still answers 302.** The members section shows «Раздел недоступен»; nav counts and the other sections keep working. (Task 20 test for `loadMembersSection`)

---

## File Structure

```
src/lib/api-enums.ts                 enum tuples + types, exactly as the API sends them
src/lib/api-labels.ts                Russian labels + tones for every enum
src/lib/people.ts                    fullName / initials
src/lib/plural.ts                    Russian plural forms
src/lib/route-id.ts                  parseId for numeric route params
src/server/api/errors.ts             ApiError, DRF error parsing, user messages
src/server/api/http.ts               fetch core: url, headers, timeout, manual redirects, zod
src/server/api/schemas.ts            zod schemas + types for every model used
src/server/api/client.ts             server-only: publicGet / authedGet / authedSend / authedDelete
src/server/api/{stats,members,projects,teams,client-requests,admin-members,account}.ts
src/server/api/auth.ts               login / refresh / verify / account / logout (proxy-safe)
src/server/api/joins.ts              roster joins, attention lists, skills
src/server/auth/cookies.ts           cookie names + options (proxy-safe)
src/server/auth/jwt.ts               jwtExpiresAt (proxy-safe)
src/server/auth/routes.ts            LOGIN_PATH, homeFor(role)
src/server/auth/session.ts           startSession / readSession / readTokens / endSession
src/server/auth/dal.ts               requireRole / requireAdmin
src/server/auth/proxy-decision.ts    pure proxy rules
proxy.ts                             refresh + optimistic redirects
src/ui/Avatar.tsx, src/ui/ProjectCover.tsx   image fallbacks
src/data/services.ts                 + ServiceCategory, PROJECT_TYPES (request form)
src/actions/admin/refresh.ts         refreshAfterAdminChange()
src/components/admin/ui/DeleteButton.tsx     two-step delete through a form action
app/(account)/…                      /account placeholder
```

### Task 0: Branch

- [ ] **Step 1: Start from a clean main on a feature branch**

```bash
git status --short          # expect: nothing
git switch -c feat/api-integration
```

---

### Task 1: Shared enums, labels and small helpers

**Files:**
- Create: `src/lib/api-enums.ts`, `src/lib/api-labels.ts`, `src/lib/people.ts`, `src/lib/plural.ts`, `src/lib/route-id.ts`
- Test: `src/lib/people.test.ts`, `src/lib/plural.test.ts`, `src/lib/route-id.test.ts`

**Interfaces:**
- Produces:
  - Types: `Position`, `ProjectStatus`, `UserRole`, `MembershipRole`, `UserStatus`, `RequestStatus`, and their tuples `POSITIONS`, `PROJECT_STATUSES`, `USER_ROLES`, `MEMBERSHIP_ROLES`, `USER_STATUSES`, `REQUEST_STATUSES`.
  - Labels: `Tone`, `POSITION_LABELS`, `positionLabel(position)`, `PROJECT_STATUS_LABELS`, `PROJECT_STATUS_TONE`, `USER_ROLE_LABELS`, `MEMBERSHIP_ROLE_LABELS`, `USER_STATUS_LABELS`, `USER_STATUS_TONE`, `REQUEST_STATUS_LABELS`, `REQUEST_STATUS_TONE`.
  - Helpers: `fullName(person, fallback?)`, `initials(name)`, `plural(count, one, few, many)`, `parseId(value): number | null`.

- [ ] **Step 1: Write the failing tests**

`src/lib/people.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { fullName, initials } from "./people";

describe("fullName", () => {
  it("joins first and last name", () => {
    expect(fullName({ first_name: "Айгерим", last_name: "Токтогулова" })).toBe("Айгерим Токтогулова");
  });

  it("falls back when both parts are blank", () => {
    expect(fullName({ first_name: " ", last_name: "" }, "anvar")).toBe("anvar");
    expect(fullName({})).toBe("Участник");
  });
});

describe("initials", () => {
  it("takes the first letters of up to two words", () => {
    expect(initials("Айгерим Токтогулова")).toBe("АТ");
    expect(initials("anvar")).toBe("A");
    expect(initials("  ")).toBe("");
  });
});
```

`src/lib/plural.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { plural } from "./plural";

describe("plural", () => {
  it.each([
    [1, "проект"],
    [2, "проекта"],
    [5, "проектов"],
    [11, "проектов"],
    [21, "проект"],
    [22, "проекта"],
    [112, "проектов"],
  ] as const)("%i → %s", (count, word) => {
    expect(plural(count, "проект", "проекта", "проектов")).toBe(word);
  });
});
```

`src/lib/route-id.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { parseId } from "./route-id";

describe("parseId", () => {
  it("accepts positive integers", () => {
    expect(parseId("12")).toBe(12);
  });

  it.each(["0", "-1", "abc", "1.5", "", "01", "99999999999"])("rejects %j", (value) => {
    expect(parseId(value)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `bun run test src/lib`
Expected: FAIL — cannot resolve `./people`, `./plural`, `./route-id`.

- [ ] **Step 3: Implement**

`src/lib/api-enums.ts`:
```ts
// Enum values exactly as the Django API sends them
// (Swagger docs at API_URL + /docs/). Shared by server and client code.

export const POSITIONS = [
  "Frontend_Developer",
  "Backend_Developer",
  "Fullstack_Developer",
  "UI/UX_Designer",
  "QA_Engineer",
  "Mobile_Developer",
] as const;
export type Position = (typeof POSITIONS)[number];

export const PROJECT_STATUSES = ["Planned", "In_progress", "Completed", "Paused"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const USER_ROLES = ["Admin", "Team_Lead", "Developer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MEMBERSHIP_ROLES = ["Team_Lead", "Developer"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const USER_STATUSES = ["Active", "Inactive"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const REQUEST_STATUSES = ["New", "Reviewing"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
```

`src/lib/api-labels.ts`:
```ts
import type {
  MembershipRole,
  Position,
  ProjectStatus,
  RequestStatus,
  UserRole,
  UserStatus,
} from "./api-enums";

// Modifier suffixes shared by the public status pills (`status--<tone>`)
// and the admin StatusBadge.
export type Tone = "positive" | "accent" | "neutral" | "muted" | "danger";

export const POSITION_LABELS: Record<Position, string> = {
  Frontend_Developer: "Frontend Developer",
  Backend_Developer: "Backend Developer",
  Fullstack_Developer: "Fullstack Developer",
  "UI/UX_Designer": "UI/UX Designer",
  QA_Engineer: "QA Engineer",
  Mobile_Developer: "Mobile Developer",
};

// Fresh accounts can have no position yet.
export const positionLabel = (position: Position | null): string | null =>
  position ? POSITION_LABELS[position] : null;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  Planned: "В планах",
  In_progress: "В разработке",
  Completed: "Готово",
  Paused: "На паузе",
};

export const PROJECT_STATUS_TONE: Record<ProjectStatus, Tone> = {
  Planned: "neutral",
  In_progress: "accent",
  Completed: "positive",
  Paused: "muted",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  Admin: "Админ",
  Team_Lead: "Тимлид",
  Developer: "Разработчик",
};

export const MEMBERSHIP_ROLE_LABELS: Record<MembershipRole, string> = {
  Team_Lead: "Тимлид",
  Developer: "Разработчик",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  Active: "Активен",
  Inactive: "Неактивен",
};

export const USER_STATUS_TONE: Record<UserStatus, Tone> = {
  Active: "positive",
  Inactive: "muted",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  New: "Новая",
  Reviewing: "На рассмотрении",
};

export const REQUEST_STATUS_TONE: Record<RequestStatus, Tone> = {
  New: "accent",
  Reviewing: "neutral",
};
```

`src/lib/people.ts`:
```ts
interface Named {
  first_name?: string | null;
  last_name?: string | null;
}

// Fresh accounts can have empty names; the caller picks the fallback
// (a login in the admin, «Участник» on the public site).
export const fullName = (person: Named, fallback = "Участник"): string =>
  [person.first_name, person.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ") || fallback;

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
```

`src/lib/plural.ts`:
```ts
// Russian plural forms: 1 проект, 2 проекта, 5 проектов, 21 проект, 11 проектов.
export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
```

`src/lib/route-id.ts`:
```ts
// Route params are strings; the API's ids are positive integers.
export const parseId = (value: string): number | null =>
  /^[1-9]\d{0,9}$/.test(value) ? Number(value) : null;
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `bun run test src/lib`
Expected: PASS (3 files).

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat: add shared api enums, labels and helpers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: API errors and the HTTP core

**Files:**
- Create: `src/server/api/errors.ts`, `src/server/api/http.ts`
- Test: `src/server/api/http.test.ts`

**Interfaces:**
- Produces:
  - Errors: `type ApiErrorKind`; `class ApiError(kind, status, message, fieldErrors = {})`; `isApiError(error, kind?)`; `parseDrfErrors(body)`; `apiErrorMessage(error)`; `nullIfNotFound(promise)`.
  - HTTP: `type HttpMethod`, `interface RequestOptions`, `apiUrl(path)`, `request<T>(path, schema, options?)`, `requestNoContent(path, options?)`.
- `http.ts` must not import `server-only` or `next/*`: `proxy.ts` uses it.

- [ ] **Step 1: Write the failing test**

`src/server/api/http.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, apiErrorMessage, nullIfNotFound, parseDrfErrors } from "./errors";
import { request, requestNoContent } from "./http";

const fetchMock = vi.fn<typeof fetch>();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const failure = async (promise: Promise<unknown>): Promise<ApiError> => {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("expected the request to fail");
};

const item = z.object({ id: z.number() });

beforeEach(() => {
  vi.stubEnv("API_URL", "http://api.test/ru/");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("request", () => {
  it("GETs base + path and validates the body", async () => {
    fetchMock.mockResolvedValue(json({ id: 1, extra: true }));
    await expect(request("/stats/", item)).resolves.toEqual({ id: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/ru/stats/");
    expect(init?.method).toBe("GET");
    expect(init?.redirect).toBe("manual");
    expect(new Headers(init?.headers).get("Authorization")).toBeNull();
  });

  it("sends JSON bodies and the bearer token", async () => {
    fetchMock.mockResolvedValue(json({ id: 2 }, 201));
    await request("/teams/", item, { method: "POST", body: { team_name: "A" }, token: "t0k" });
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer t0k");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init?.body).toBe('{"team_name":"A"}');
  });

  it("passes Next cache options through", async () => {
    fetchMock.mockResolvedValue(json({ id: 3 }));
    await request("/members/", item, { next: { revalidate: 60, tags: ["members"] } });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      next: { revalidate: 60, tags: ["members"] },
    });
  });

  it("maps DRF 400 bodies to field errors and a form message", async () => {
    fetchMock.mockResolvedValue(
      json({ email: ["Введите правильный адрес."], non_field_errors: ["Проверьте данные."] }, 400),
    );
    const error = await failure(request("/client-requests/", item, { method: "POST", body: {} }));
    expect(error.kind).toBe("validation");
    expect(error.fieldErrors).toEqual({ email: "Введите правильный адрес." });
    expect(apiErrorMessage(error)).toBe("Проверьте данные.");
  });

  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "not_found"],
    [500, "unavailable"],
    [502, "unavailable"],
  ] as const)("maps %i to %s", async (status, kind) => {
    fetchMock.mockResolvedValue(json({ detail: "x" }, status));
    expect((await failure(request("/teams/", item))).kind).toBe(kind);
  });

  it("treats a redirect as a blocked endpoint", async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: 302, headers: { Location: "/ru/admin/login/" } }),
    );
    expect((await failure(request("/admin/members/", item))).kind).toBe("redirected");
  });

  it("turns network failures and timeouts into unavailable", async () => {
    fetchMock.mockRejectedValueOnce(new DOMException("The operation timed out.", "TimeoutError"));
    expect((await failure(request("/stats/", item))).kind).toBe("unavailable");
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await failure(request("/stats/", item))).kind).toBe("unavailable");
  });

  it("rejects non-JSON and off-schema bodies", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fetchMock.mockResolvedValueOnce(new Response("<html></html>", { status: 200 }));
    expect((await failure(request("/stats/", item))).kind).toBe("bad_response");
    fetchMock.mockResolvedValueOnce(json({ id: "1" }));
    expect((await failure(request("/stats/", item))).kind).toBe("bad_response");
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("accepts 204 for no-content calls", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(requestNoContent("/teams/1/", { method: "DELETE", token: "t" })).resolves.toBeUndefined();
  });

  it("fails clearly when API_URL is missing", async () => {
    vi.stubEnv("API_URL", "");
    expect((await failure(request("/stats/", item))).kind).toBe("unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("errors", () => {
  it("reads DRF detail and nested messages", () => {
    expect(parseDrfErrors({ detail: "Нет доступа" })).toEqual({ message: "Нет доступа", fieldErrors: {} });
    expect(parseDrfErrors({ members: [{ user: ["Неверный id"] }] }).fieldErrors).toEqual({
      members: "Неверный id",
    });
  });

  it("gives every kind a Russian message", () => {
    expect(apiErrorMessage(new ApiError("unavailable", 0, "x"))).toMatch(/Сервер недоступен/);
    expect(apiErrorMessage(new ApiError("validation", 400, ""))).toBe("Проверьте поля формы.");
  });

  it("nullIfNotFound turns only 404 into null", async () => {
    await expect(nullIfNotFound(Promise.reject(new ApiError("not_found", 404, "x")))).resolves.toBeNull();
    const forbidden = new ApiError("forbidden", 403, "x");
    await expect(nullIfNotFound(Promise.reject(forbidden))).rejects.toBe(forbidden);
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `bun run test src/server/api/http.test.ts`
Expected: FAIL — cannot resolve `./errors` / `./http`.

- [ ] **Step 3: Implement**

`src/server/api/errors.ts`:
```ts
export type ApiErrorKind =
  | "unavailable"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "redirected"
  | "bad_response";

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const isApiError = (error: unknown, kind?: ApiErrorKind): error is ApiError =>
  error instanceof ApiError && (kind === undefined || error.kind === kind);

const firstMessage = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  const items = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.values(value)
      : [];
  for (const entry of items) {
    const message = firstMessage(entry);
    if (message) return message;
  }
  return undefined;
};

// DRF answers {"detail": "..."} or {"field": ["..."], "non_field_errors": ["..."]}.
export function parseDrfErrors(body: unknown): {
  message?: string;
  fieldErrors: Record<string, string>;
} {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: firstMessage(body), fieldErrors: {} };
  }
  const { detail, non_field_errors: nonField, ...fields } = body as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  for (const [field, value] of Object.entries(fields)) {
    const message = firstMessage(value);
    if (message) fieldErrors[field] = message;
  }
  return { message: firstMessage(detail) ?? firstMessage(nonField), fieldErrors };
}

const USER_MESSAGES: Record<ApiErrorKind, string> = {
  unavailable: "Сервер недоступен. Попробуйте ещё раз через минуту.",
  unauthorized: "Сессия истекла. Войдите снова.",
  forbidden: "Недостаточно прав для этого действия.",
  not_found: "Запись не найдена — возможно, её уже удалили.",
  validation: "Проверьте поля формы.",
  redirected: "Раздел временно недоступен: бэкенд перенаправляет запрос.",
  bad_response: "Сервер ответил в неожиданном формате.",
};

// What a person sees. Validation errors keep the backend's own wording.
export const apiErrorMessage = (error: ApiError): string =>
  error.kind === "validation" && error.message ? error.message : USER_MESSAGES[error.kind];

export async function nullIfNotFound<T>(load: Promise<T>): Promise<T | null> {
  try {
    return await load;
  } catch (error) {
    if (isApiError(error, "not_found")) return null;
    throw error;
  }
}
```

`src/server/api/http.ts`:
```ts
import type { ZodType } from "zod";
import { ApiError, parseDrfErrors } from "./errors";

// No `server-only` or next/* imports: proxy.ts uses this module too.

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
  timeoutMs?: number;
}

const TIMEOUT_MS = 10_000;

export function apiUrl(path: string): string {
  const base = process.env.API_URL;
  if (!base) throw new ApiError("unavailable", 0, "API_URL is not set");
  return `${base.replace(/\/+$/, "")}${path}`;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = "GET", body, token, cache, next, timeoutMs = TIMEOUT_MS } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(apiUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // A 3xx means the route is shadowed (today: by the Django admin).
      // Surface it instead of following it to an HTML login page.
      redirect: "manual",
      // Note: a signal opts out of fetch memoization; resource getters
      // dedupe with React cache() instead.
      signal: AbortSignal.timeout(timeoutMs),
      cache,
      next,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("unavailable", 0, `${method} ${path}: ${String(error)}`);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function toError(response: Response, where: string): Promise<ApiError> {
  const { status } = response;
  if (response.type === "opaqueredirect" || (status >= 300 && status < 400)) {
    const location = response.headers.get("location") ?? "";
    return new ApiError("redirected", status, `${where} → ${status} ${location}`.trim());
  }
  if (status === 400) {
    const { message, fieldErrors } = parseDrfErrors(await readJson(response));
    return new ApiError("validation", status, message ?? "", fieldErrors);
  }
  if (status === 401) return new ApiError("unauthorized", status, `${where} → 401`);
  if (status === 403) return new ApiError("forbidden", status, `${where} → 403`);
  if (status === 404) return new ApiError("not_found", status, `${where} → 404`);
  return new ApiError("unavailable", status, `${where} → ${status}`);
}

async function call(path: string, options: RequestOptions): Promise<unknown> {
  const where = `${options.method ?? "GET"} ${path}`;
  const response = await send(path, options);
  if (!response.ok) throw await toError(response, where);
  const text = response.status === 204 ? "" : await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("bad_response", response.status, `${where}: not JSON`);
  }
}

export async function request<T>(
  path: string,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const data = await call(path, options);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const where = `${options.method ?? "GET"} ${path}`;
    console.error(`Unexpected API response for ${where}`, parsed.error.issues);
    throw new ApiError("bad_response", 200, `${where}: schema mismatch`);
  }
  return parsed.data;
}

export async function requestNoContent(path: string, options: RequestOptions = {}): Promise<void> {
  await call(path, options);
}
```

- [ ] **Step 4: Run the test to see it pass**

Run: `bun run test src/server/api/http.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/api/errors.ts src/server/api/http.ts src/server/api/http.test.ts
git commit -m "feat: add api http core with drf error mapping" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: API schemas

**Files:**
- Create: `src/server/api/schemas.ts`
- Test: `src/server/api/schemas.test.ts`

**Interfaces:**
- Consumes: enum tuples from `src/lib/api-enums.ts` (Task 1).
- Produces:
  - Schemas: `statsSchema`, `membershipSchema`, `projectListItemSchema`, `projectDetailSchema`, `memberListItemSchema`, `memberDetailSchema`, `teamListItemSchema`, `teamDetailSchema`, `clientRequestListItemSchema`, `clientRequestDetailSchema`, `adminMemberListItemSchema`, `adminMemberDetailSchema`, `accountSchema`, `tokensSchema`, `createdSchema`.
  - Types: `Stats`, `Membership`, `ProjectListItem`, `ProjectDetail`, `MemberListItem`, `MemberDetail`, `TeamListItem`, `TeamDetail`, `ClientRequestListItem`, `ClientRequestDetail`, `AdminMemberListItem`, `AdminMemberDetail`, `Account`, `Tokens`.
- No `server-only`: client components import the types (`import type`) and proxy uses `tokensSchema`.

- [ ] **Step 1: Write the failing test**

`src/server/api/schemas.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  accountSchema,
  memberDetailSchema,
  memberListItemSchema,
  projectDetailSchema,
  statsSchema,
} from "./schemas";

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

  it("rejects the anonymous /personal-account/ answer", () => {
    expect(accountSchema.safeParse({ id: null, login: "", avatar: null }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `bun run test src/server/api/schemas.test.ts`
Expected: FAIL — cannot resolve `./schemas`.

- [ ] **Step 3: Implement**

`src/server/api/schemas.ts`:
```ts
import { z } from "zod";
import {
  MEMBERSHIP_ROLES,
  POSITIONS,
  PROJECT_STATUSES,
  REQUEST_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from "@/src/lib/api-enums";

// Mirrors the API's Swagger docs (API_URL + /docs/), corrected where real responses
// differ from the Swagger file: `members` and `projects` are arrays, not
// strings. Objects are non-strict, so new backend fields never break a page.

const text = z.string().nullish().transform((value) => value ?? "");
const url = z.string().nullish().transform((value) => value || null);
// Fresh accounts have no position yet; anything unknown reads as "none".
const position = z.enum(POSITIONS).nullable().catch(null);

export const createdSchema = z.object({ id: z.number() });

export const statsSchema = z.object({
  members_count: z.number(),
  projects_count: z.number(),
  companies_count: z.number(),
});

// Rows of project/team `members`: user ids only, names come from /members/.
export const membershipSchema = z.object({
  id: z.number(),
  user: z.number(),
  role: z.enum(MEMBERSHIP_ROLES),
});

export const projectListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  project_status: z.enum(PROJECT_STATUSES),
  category: z.string(),
  preview_image: url,
});

export const projectDetailSchema = projectListItemSchema.extend({
  description: text,
  demo_url: url,
  github_url: url,
  created_at: z.string(),
  members: z.array(membershipSchema),
});

export const memberListItemSchema = z.object({
  id: z.number(),
  first_name: text,
  last_name: text,
  position,
  avatar: url,
  status: z.enum(USER_STATUSES),
});

export const memberDetailSchema = memberListItemSchema.extend({
  bio: text,
  skills: text,
  github: url,
  linkedin: url,
  portfolio: url,
  resume: url,
  projects: z.array(projectListItemSchema),
});

export const teamListItemSchema = z.object({
  id: z.number(),
  team_name: z.string(),
  team_image: url,
});

export const teamDetailSchema = teamListItemSchema.extend({
  description: text,
  created_at: z.string(),
  members: z.array(membershipSchema),
});

export const clientRequestListItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  title: z.string(),
  status: z.enum(REQUEST_STATUSES),
  created_at: z.string(),
});

export const clientRequestDetailSchema = clientRequestListItemSchema.extend({
  company: text,
  email: z.string(),
  phone: text,
  description: text,
  project_type: text,
  budget: z.number().nullish().transform((value) => value ?? null),
});

export const adminMemberListItemSchema = z.object({
  id: z.number(),
  login: z.string(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
});

export const adminMemberDetailSchema = adminMemberListItemSchema.extend({
  created_at: z.string(),
  first_name: text,
  last_name: text,
  avatar: url,
  bio: text,
  position,
  skills: text,
  github: url,
  linkedin: url,
  portfolio: url,
  resume: url,
});

// GET /personal-account/ — a numeric id also guards against the anonymous
// answer (200 with id: null).
export const accountSchema = z.object({
  id: z.number(),
  login: z.string(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
  first_name: text,
  last_name: text,
});

export const tokensSchema = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1).optional(),
});

export type Stats = z.infer<typeof statsSchema>;
export type Membership = z.infer<typeof membershipSchema>;
export type ProjectListItem = z.infer<typeof projectListItemSchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;
export type MemberListItem = z.infer<typeof memberListItemSchema>;
export type MemberDetail = z.infer<typeof memberDetailSchema>;
export type TeamListItem = z.infer<typeof teamListItemSchema>;
export type TeamDetail = z.infer<typeof teamDetailSchema>;
export type ClientRequestListItem = z.infer<typeof clientRequestListItemSchema>;
export type ClientRequestDetail = z.infer<typeof clientRequestDetailSchema>;
export type AdminMemberListItem = z.infer<typeof adminMemberListItemSchema>;
export type AdminMemberDetail = z.infer<typeof adminMemberDetailSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Tokens = z.infer<typeof tokensSchema>;
```

- [ ] **Step 4: Run the test to see it pass**

Run: `bun run test src/server/api/schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/api/schemas.ts src/server/api/schemas.test.ts
git commit -m "feat: add zod schemas for api responses" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Auth cookie primitives

**Files:**
- Create: `src/server/auth/cookies.ts`, `src/server/auth/jwt.ts`, `src/server/auth/routes.ts`
- Test: `src/server/auth/jwt.test.ts`

**Interfaces:**
- Consumes: `UserRole` (Task 1).
- Produces:
  - `cookies.ts`: `ACCESS_COOKIE = "mc_access"`, `REFRESH_COOKIE = "mc_refresh"`, `SESSION_COOKIE = "mc_session"`, `AUTH_COOKIES`, `authCookieOptions(expiresAt)`.
  - `jwt.ts`: `jwtExpiresAt(token): number | null` (ms epoch).
  - `routes.ts`: `LOGIN_PATH`, `homeFor(role)`.
- All three files must stay free of `server-only` and `next/headers`: proxy imports them.

- [ ] **Step 1: Write the failing test**

`src/server/auth/jwt.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { authCookieOptions } from "./cookies";
import { jwtExpiresAt } from "./jwt";
import { homeFor } from "./routes";

const jwt = (payload: object) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;

describe("jwtExpiresAt", () => {
  it("reads exp in milliseconds", () => {
    expect(jwtExpiresAt(jwt({ exp: 2_000_000_000, user_id: 3 }))).toBe(2_000_000_000_000);
  });

  it("returns null without exp or for garbage", () => {
    expect(jwtExpiresAt(jwt({ user_id: 3 }))).toBeNull();
    expect(jwtExpiresAt("not-a-jwt")).toBeNull();
    expect(jwtExpiresAt("a.%%%.c")).toBeNull();
  });
});

describe("authCookieOptions", () => {
  it("is httpOnly, lax, root-scoped and expires at the given time", () => {
    expect(authCookieOptions(1_000)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(1_000),
    });
  });
});

describe("homeFor", () => {
  it("sends admins to /admin and everyone else to /account", () => {
    expect(homeFor("Admin")).toBe("/admin");
    expect(homeFor("Team_Lead")).toBe("/account");
    expect(homeFor("Developer")).toBe("/account");
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `bun run test src/server/auth/jwt.test.ts`
Expected: FAIL — cannot resolve `./cookies`, `./jwt`, `./routes`.

- [ ] **Step 3: Implement**

`src/server/auth/cookies.ts`:
```ts
// Shared by Server Actions (cookies()) and proxy.ts (NextResponse cookies).
export const ACCESS_COOKIE = "mc_access";
export const REFRESH_COOKIE = "mc_refresh";
export const SESSION_COOKIE = "mc_session";
export const AUTH_COOKIES = [ACCESS_COOKIE, REFRESH_COOKIE, SESSION_COOKIE] as const;

export interface AuthCookieOptions {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  expires: Date;
}

export const authCookieOptions = (expiresAt: number): AuthCookieOptions => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  expires: new Date(expiresAt),
});
```

`src/server/auth/jwt.ts`:
```ts
// Reads `exp` without checking the signature: only the backend can verify
// its tokens; we just need to know when to refresh them.
export function jwtExpiresAt(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json: unknown = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const exp = json && typeof json === "object" ? (json as { exp?: unknown }).exp : undefined;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}
```

`src/server/auth/routes.ts`:
```ts
import type { UserRole } from "@/src/lib/api-enums";

export const LOGIN_PATH = "/login";

export const homeFor = (role: UserRole): string => (role === "Admin" ? "/admin" : "/account");
```

- [ ] **Step 4: Run the test to see it pass**

Run: `bun run test src/server/auth/jwt.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/auth/cookies.ts src/server/auth/jwt.ts src/server/auth/routes.ts src/server/auth/jwt.test.ts
git commit -m "feat: add auth cookie, jwt and route helpers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Server client wrappers and env

**Files:**
- Create: `src/server/api/client.ts`, `.env.example`
- Modify: `.gitignore`, local `.env` (not committed)
- Test: `src/server/api/client.test.ts`

**Interfaces:**
- Consumes: `request`, `requestNoContent`, `HttpMethod` (Task 2); `isApiError` (Task 2); `ACCESS_COOKIE` (Task 4); `LOGIN_PATH` (Task 4).
- Produces:
  - `type PublicTag = "members" | "projects" | "stats"` and `PUBLIC_TAGS`;
  - `publicGet<T>(path, schema, tag)`;
  - `authedGet<T>(path, schema)`;
  - `authedSend<T>(method, path, body, schema)`;
  - `authedDelete(path)`.

- [ ] **Step 1: Write the failing test**

`src/server/api/client.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError } from "./errors";
import { request, requestNoContent } from "./http";
import { authedDelete, authedGet, authedSend, publicGet } from "./client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  }),
}));
vi.mock("./http", () => ({ request: vi.fn(), requestNoContent: vi.fn() }));

const schema = z.object({ id: z.number() });

const signedIn = (token?: string) => {
  const store = {
    get: (name: string) => (name === "mc_access" && token ? { name, value: token } : undefined),
  };
  vi.mocked(cookies).mockResolvedValue(store as unknown as Awaited<ReturnType<typeof cookies>>);
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("publicGet", () => {
  it("caches for 60 s under its tag and never sends a token", async () => {
    vi.mocked(request).mockResolvedValue({ id: 1 });
    await publicGet("/members/", schema, "members");
    expect(request).toHaveBeenCalledWith("/members/", schema, {
      next: { revalidate: 60, tags: ["members"] },
    });
  });
});

describe("authed calls", () => {
  it("send the access token uncached", async () => {
    signedIn("t0k");
    vi.mocked(request).mockResolvedValue({ id: 1 });
    await authedGet("/teams/", schema);
    await authedSend("PATCH", "/teams/1/", { team_name: "A" }, schema);
    expect(request).toHaveBeenNthCalledWith(1, "/teams/", schema, { token: "t0k", cache: "no-store" });
    expect(request).toHaveBeenNthCalledWith(2, "/teams/1/", schema, {
      method: "PATCH",
      body: { team_name: "A" },
      token: "t0k",
      cache: "no-store",
    });
  });

  it("delete without a body", async () => {
    signedIn("t0k");
    vi.mocked(requestNoContent).mockResolvedValue(undefined);
    await authedDelete("/teams/1/");
    expect(requestNoContent).toHaveBeenCalledWith("/teams/1/", {
      method: "DELETE",
      token: "t0k",
      cache: "no-store",
    });
  });

  it("redirect to /login without a token", async () => {
    signedIn(undefined);
    await expect(authedGet("/teams/", schema)).rejects.toThrow("NEXT_REDIRECT /login");
    expect(request).not.toHaveBeenCalled();
  });

  it("redirect to /login when the API rejects the token", async () => {
    signedIn("old");
    vi.mocked(request).mockRejectedValue(new ApiError("unauthorized", 401, "GET /teams/ → 401"));
    await expect(authedGet("/teams/", schema)).rejects.toThrow("NEXT_REDIRECT /login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("rethrow every other API error", async () => {
    signedIn("t0k");
    const error = new ApiError("forbidden", 403, "GET /teams/ → 403");
    vi.mocked(request).mockRejectedValue(error);
    await expect(authedGet("/teams/", schema)).rejects.toBe(error);
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `bun run test src/server/api/client.test.ts`
Expected: FAIL — cannot resolve `./client`.

- [ ] **Step 3: Implement**

`src/server/api/client.ts`:
```ts
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ZodType } from "zod";
import { ACCESS_COOKIE } from "@/src/server/auth/cookies";
import { LOGIN_PATH } from "@/src/server/auth/routes";
import { isApiError } from "./errors";
import { request, requestNoContent, type HttpMethod } from "./http";

export type PublicTag = "members" | "projects" | "stats";
export const PUBLIC_TAGS: readonly PublicTag[] = ["members", "projects", "stats"];

const PUBLIC_REVALIDATE_SECONDS = 60;

// Public data: shared tagged cache, never a token. connection() keeps the
// page request-time rendered, so builds never depend on the API being up.
export async function publicGet<T>(path: string, schema: ZodType<T>, tag: PublicTag): Promise<T> {
  await connection();
  return request(path, schema, { next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [tag] } });
}

// Token calls are never cached; a rejected token ends up on /login, where
// proxy.ts verifies it and clears the dead cookies.
async function withToken<T>(call: (token: string) => Promise<T>): Promise<T> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect(LOGIN_PATH);
  try {
    return await call(token);
  } catch (error) {
    if (isApiError(error, "unauthorized")) redirect(LOGIN_PATH);
    throw error;
  }
}

export const authedGet = <T>(path: string, schema: ZodType<T>): Promise<T> =>
  withToken((token) => request(path, schema, { token, cache: "no-store" }));

export const authedSend = <T>(
  method: Exclude<HttpMethod, "GET">,
  path: string,
  body: unknown,
  schema: ZodType<T>,
): Promise<T> => withToken((token) => request(path, schema, { method, body, token, cache: "no-store" }));

export const authedDelete = (path: string): Promise<void> =>
  withToken((token) => requestNoContent(path, { method: "DELETE", token, cache: "no-store" }));
```

`.env.example` (new, committed — names only, never the real address):
```bash
# Django REST API base, ending in /ru. Server-side only, never NEXT_PUBLIC_.
# Ask the team for the value; it lives only in your local .env.
API_URL=
# Signs the mc_session cookie: any long random string.
AUTH_SECRET=
```

`.gitignore`: right after the existing `.env*` line add:
```
!.env.example
```

Local `.env` (never committed). Append the real address the team gave you, without printing the file:
```bash
grep -q '^API_URL=' .env || printf '\nAPI_URL=%s\n' "<API base URL ending in /ru>" >> .env
```

- [ ] **Step 4: Run the tests and the type check**

Run: `bun run test src/server/api && bunx next typegen && bunx tsc --noEmit`
Expected: tests PASS, tsc exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/server/api/client.ts src/server/api/client.test.ts .env.example .gitignore
git commit -m "feat: add cached and authed api client wrappers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Resource modules and roster joins

**Files:**
- Create:
  - `src/server/api/stats.ts`, `members.ts`, `projects.ts`, `teams.ts`
  - `src/server/api/client-requests.ts`, `admin-members.ts`, `account.ts`
  - `src/server/api/joins.ts`
- Test: `src/server/api/joins.test.ts`, `src/server/api/projects.test.ts`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces (every getter is wrapped in React `cache`; `fresh = true` reads through the token, uncached):
  - **stats:** `getStats(): Promise<Stats>`
  - **members:**
    - `getMembers(fresh = false): Promise<MemberListItem[]>`
    - `getPublicRoster(): Promise<MemberListItem[]>` (active only)
    - `getMember(id, fresh = false): Promise<MemberDetail | null>`
    - `setMemberStatus(id, status): Promise<void>`
  - **projects:**
    - reads: `getProjects(fresh = false)`, `getProject(id, fresh = false): Promise<ProjectDetail | null>`, `getProjectsWithMembers(fresh = false): Promise<ProjectDetail[]>`, `getProjectMembers(id): Promise<Membership[]>`
    - writes: `interface ProjectWrite`, `createProject(data): Promise<number>`, `updateProject(id, data)`, `deleteProject(id)`, `addProjectMember(projectId, user, role)`, `removeProjectMember(projectId, userId)`
  - **teams:**
    - reads: `getTeams()`, `getTeam(id): Promise<TeamDetail | null>`, `getTeamMembers(id)`
    - writes: `interface TeamWrite`, `createTeam(data): Promise<number>`, `updateTeam`, `deleteTeam`, `addTeamMember`, `removeTeamMember`
  - **client-requests:** `interface ClientRequestWrite`, `createClientRequest(data)` (public, no token), `getClientRequests()`, `getClientRequest(id)`, `setClientRequestStatus(id, status)`
  - **admin-members:** `interface AdminMemberCreate`, `interface AdminMemberPatch`, `getAdminMembers()`, `getAdminMember(id)`, `createAdminMember(data): Promise<number>`, `updateAdminMember(id, patch)`, `deleteAdminMember(id)`
  - **account:** `getMyAccount(): Promise<Account>`
  - **joins:**
    - `interface TeamPerson { member: MemberListItem; role: MembershipRole }`
    - `withPeople(memberships, roster)`, `hasLead(project)`, `projectsWithoutLead(projects)`, `idleMembers(roster, projects)`
    - `interface ProjectTeam { project: ProjectDetail; people: TeamPerson[] }` and `projectTeams(projects, roster)`
    - `splitSkills(skills): string[]`

- [ ] **Step 1: Write the failing tests**

`src/server/api/joins.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { idleMembers, projectTeams, projectsWithoutLead, splitSkills, withPeople } from "./joins";
import type { MemberListItem, ProjectDetail } from "./schemas";

const person = (id: number, status: MemberListItem["status"] = "Active"): MemberListItem => ({
  id,
  first_name: `Имя${id}`,
  last_name: "Фамилия",
  position: "Frontend_Developer",
  avatar: null,
  status,
});

const project = (
  id: number,
  members: ProjectDetail["members"],
  project_status: ProjectDetail["project_status"] = "In_progress",
): ProjectDetail => ({
  id,
  name: `Проект ${id}`,
  project_status,
  category: "Web",
  preview_image: null,
  description: "",
  demo_url: null,
  github_url: null,
  created_at: "2026-09-28T00:00:00+06:00",
  members,
});

const roster = [person(1), person(2), person(3), person(4, "Inactive")];

describe("withPeople", () => {
  it("puts leads first and drops people missing from the roster", () => {
    const people = withPeople(
      [
        { id: 10, user: 2, role: "Developer" },
        { id: 11, user: 99, role: "Developer" },
        { id: 12, user: 1, role: "Team_Lead" },
      ],
      roster,
    );
    expect(people.map(({ member, role }) => [member.id, role])).toEqual([
      [1, "Team_Lead"],
      [2, "Developer"],
    ]);
  });
});

describe("attention lists", () => {
  const projects = [
    project(1, [{ id: 1, user: 1, role: "Team_Lead" }]),
    project(2, [{ id: 2, user: 2, role: "Developer" }]),
    project(3, [], "Completed"),
  ];

  it("lists unfinished projects without a lead", () => {
    expect(projectsWithoutLead(projects).map((item) => item.id)).toEqual([2]);
  });

  it("lists active members who are in no project", () => {
    expect(idleMembers(roster, projects).map((item) => item.id)).toEqual([3]);
  });

  it("builds project teams and skips empty ones", () => {
    expect(projectTeams(projects, roster).map((team) => team.project.id)).toEqual([1, 2]);
  });
});

describe("splitSkills", () => {
  it("splits on commas and newlines, trims and dedupes", () => {
    expect(splitSkills("React, TypeScript\nReact ,, Next.js ")).toEqual(["React", "TypeScript", "Next.js"]);
    expect(splitSkills("")).toEqual([]);
  });
});
```

`src/server/api/projects.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./errors";
import { publicGet } from "./client";
import { getProject, getProjectsWithMembers } from "./projects";

vi.mock("./client", () => ({
  publicGet: vi.fn(),
  authedGet: vi.fn(),
  authedSend: vi.fn(),
  authedDelete: vi.fn(),
}));

const listItem = (id: number) => ({
  id,
  name: `Проект ${id}`,
  project_status: "Planned",
  category: "Web",
  preview_image: null,
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("projects", () => {
  it("returns null for a missing project and skips it in the team list", async () => {
    vi.mocked(publicGet).mockImplementation((async (path: string) => {
      if (path === "/projects/") return [listItem(1), listItem(2)];
      if (path === "/projects/1/") return { ...listItem(1), members: [] };
      throw new ApiError("not_found", 404, `GET ${path} → 404`);
    }) as typeof publicGet);

    await expect(getProject(2)).resolves.toBeNull();
    const all = await getProjectsWithMembers();
    expect(all.map((item) => item.id)).toEqual([1]);
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `bun run test src/server/api/joins.test.ts src/server/api/projects.test.ts`
Expected: FAIL — cannot resolve `./joins` / `./projects`.

- [ ] **Step 3: Implement**

`src/server/api/stats.ts`:
```ts
import "server-only";
import { cache } from "react";
import { publicGet } from "./client";
import { statsSchema, type Stats } from "./schemas";

export const getStats = cache((): Promise<Stats> => publicGet("/stats/", statsSchema, "stats"));
```

`src/server/api/members.ts`:
```ts
import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { UserStatus } from "@/src/lib/api-enums";
import { authedGet, authedSend, publicGet } from "./client";
import { nullIfNotFound } from "./errors";
import {
  memberDetailSchema,
  memberListItemSchema,
  type MemberDetail,
  type MemberListItem,
} from "./schemas";

const listSchema = z.array(memberListItemSchema);

// `fresh`: the admin reads through its token, never from the shared cache.
export const getMembers = cache(
  (fresh = false): Promise<MemberListItem[]> =>
    fresh ? authedGet("/members/", listSchema) : publicGet("/members/", listSchema, "members"),
);

// The public site never shows inactive people.
export const getPublicRoster = cache(async (): Promise<MemberListItem[]> =>
  (await getMembers()).filter((member) => member.status === "Active"),
);

export const getMember = cache(
  (id: number, fresh = false): Promise<MemberDetail | null> =>
    nullIfNotFound(
      fresh
        ? authedGet(`/members/${id}/`, memberDetailSchema)
        : publicGet(`/members/${id}/`, memberDetailSchema, "members"),
    ),
);

// `status` is read-only in the admin schema; this endpoint accepts it.
export async function setMemberStatus(id: number, status: UserStatus): Promise<void> {
  await authedSend("PATCH", `/members/${id}/`, { status }, z.unknown());
}
```

`src/server/api/projects.ts`:
```ts
import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { MembershipRole, ProjectStatus } from "@/src/lib/api-enums";
import { authedDelete, authedGet, authedSend, publicGet } from "./client";
import { nullIfNotFound } from "./errors";
import {
  createdSchema,
  membershipSchema,
  projectDetailSchema,
  projectListItemSchema,
  type Membership,
  type ProjectDetail,
  type ProjectListItem,
} from "./schemas";

export interface ProjectWrite {
  name: string;
  description: string;
  project_status: ProjectStatus;
  category: string;
  demo_url: string | null;
  github_url: string | null;
}

const listSchema = z.array(projectListItemSchema);

export const getProjects = cache(
  (fresh = false): Promise<ProjectListItem[]> =>
    fresh ? authedGet("/projects/", listSchema) : publicGet("/projects/", listSchema, "projects"),
);

export const getProject = cache(
  (id: number, fresh = false): Promise<ProjectDetail | null> =>
    nullIfNotFound(
      fresh
        ? authedGet(`/projects/${id}/`, projectDetailSchema)
        : publicGet(`/projects/${id}/`, projectDetailSchema, "projects"),
    ),
);

// The list endpoint has no `members`, so teams cost one request per
// project (docs/backend-issues.md). They run in parallel.
export const getProjectsWithMembers = cache(async (fresh = false): Promise<ProjectDetail[]> => {
  const projects = await getProjects(fresh);
  const details = await Promise.all(projects.map((project) => getProject(project.id, fresh)));
  return details.filter((project): project is ProjectDetail => project !== null);
});

export const getProjectMembers = cache(
  (id: number): Promise<Membership[]> => authedGet(`/projects/${id}/members/`, z.array(membershipSchema)),
);

export async function createProject(data: ProjectWrite): Promise<number> {
  return (await authedSend("POST", "/projects/", data, createdSchema)).id;
}

export async function updateProject(id: number, data: ProjectWrite): Promise<void> {
  await authedSend("PATCH", `/projects/${id}/`, data, z.unknown());
}

export const deleteProject = (id: number): Promise<void> => authedDelete(`/projects/${id}/`);

export async function addProjectMember(
  projectId: number,
  user: number,
  role: MembershipRole,
): Promise<void> {
  await authedSend("POST", `/projects/${projectId}/members/`, { user, role }, z.unknown());
}

export const removeProjectMember = (projectId: number, userId: number): Promise<void> =>
  authedDelete(`/projects/${projectId}/members/${userId}/`);
```

`src/server/api/teams.ts`:
```ts
import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { MembershipRole } from "@/src/lib/api-enums";
import { authedDelete, authedGet, authedSend } from "./client";
import { nullIfNotFound } from "./errors";
import {
  createdSchema,
  membershipSchema,
  teamDetailSchema,
  teamListItemSchema,
  type Membership,
  type TeamDetail,
  type TeamListItem,
} from "./schemas";

export interface TeamWrite {
  team_name: string;
  description: string;
}

// /teams/ needs a token, so teams exist only inside the admin.
export const getTeams = cache(
  (): Promise<TeamListItem[]> => authedGet("/teams/", z.array(teamListItemSchema)),
);

export const getTeam = cache(
  (id: number): Promise<TeamDetail | null> => nullIfNotFound(authedGet(`/teams/${id}/`, teamDetailSchema)),
);

export const getTeamMembers = cache(
  (id: number): Promise<Membership[]> => authedGet(`/teams/${id}/members/`, z.array(membershipSchema)),
);

export async function createTeam(data: TeamWrite): Promise<number> {
  return (await authedSend("POST", "/teams/", data, createdSchema)).id;
}

export async function updateTeam(id: number, data: TeamWrite): Promise<void> {
  await authedSend("PATCH", `/teams/${id}/`, data, z.unknown());
}

export const deleteTeam = (id: number): Promise<void> => authedDelete(`/teams/${id}/`);

export async function addTeamMember(teamId: number, user: number, role: MembershipRole): Promise<void> {
  await authedSend("POST", `/teams/${teamId}/members/`, { user, role }, z.unknown());
}

export const removeTeamMember = (teamId: number, userId: number): Promise<void> =>
  authedDelete(`/teams/${teamId}/members/${userId}/`);
```

`src/server/api/client-requests.ts`:
```ts
import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { RequestStatus } from "@/src/lib/api-enums";
import { authedGet, authedSend } from "./client";
import { nullIfNotFound } from "./errors";
import { request } from "./http";
import {
  clientRequestDetailSchema,
  clientRequestListItemSchema,
  createdSchema,
  type ClientRequestDetail,
  type ClientRequestListItem,
} from "./schemas";

export interface ClientRequestWrite {
  name: string;
  company: string;
  email: string;
  phone: string;
  title: string;
  description: string;
  project_type: string;
  budget: number | null;
}

// Clients have no account, so this one goes out without a token.
export async function createClientRequest(data: ClientRequestWrite): Promise<void> {
  await request("/client-requests/", createdSchema, { method: "POST", body: data, cache: "no-store" });
}

export const getClientRequests = cache(
  (): Promise<ClientRequestListItem[]> =>
    authedGet("/client-requests/", z.array(clientRequestListItemSchema)),
);

export const getClientRequest = cache(
  (id: number): Promise<ClientRequestDetail | null> =>
    nullIfNotFound(authedGet(`/client-requests/${id}/`, clientRequestDetailSchema)),
);

export async function setClientRequestStatus(id: number, status: RequestStatus): Promise<void> {
  await authedSend("PATCH", `/client-requests/${id}/`, { status }, z.unknown());
}
```

`src/server/api/admin-members.ts`:
```ts
import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { Position, UserRole } from "@/src/lib/api-enums";
import { authedDelete, authedGet, authedSend } from "./client";
import { nullIfNotFound } from "./errors";
import {
  adminMemberDetailSchema,
  adminMemberListItemSchema,
  createdSchema,
  type AdminMemberDetail,
  type AdminMemberListItem,
} from "./schemas";

export interface AdminMemberCreate {
  login: string;
  password: string;
  role: UserRole;
}

export interface AdminMemberPatch {
  login?: string;
  password?: string;
  role?: UserRole;
  first_name?: string;
  last_name?: string;
  bio?: string;
  position?: Position;
  skills?: string;
  github?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
}

export const getAdminMembers = cache(
  (): Promise<AdminMemberListItem[]> => authedGet("/admin/members/", z.array(adminMemberListItemSchema)),
);

export const getAdminMember = cache(
  (id: number): Promise<AdminMemberDetail | null> =>
    nullIfNotFound(authedGet(`/admin/members/${id}/`, adminMemberDetailSchema)),
);

export async function createAdminMember(data: AdminMemberCreate): Promise<number> {
  return (await authedSend("POST", "/admin/members/", data, createdSchema)).id;
}

export async function updateAdminMember(id: number, patch: AdminMemberPatch): Promise<void> {
  await authedSend("PATCH", `/admin/members/${id}/`, patch, z.unknown());
}

export const deleteAdminMember = (id: number): Promise<void> => authedDelete(`/admin/members/${id}/`);
```

`src/server/api/account.ts`:
```ts
import "server-only";
import { cache } from "react";
import { authedGet } from "./client";
import { accountSchema, type Account } from "./schemas";

// The signed-in user's own profile. Spec 2 adds the résumé sections here.
export const getMyAccount = cache((): Promise<Account> => authedGet("/personal-account/", accountSchema));
```

`src/server/api/joins.ts`:
```ts
import type { MembershipRole } from "@/src/lib/api-enums";
import type { MemberListItem, Membership, ProjectDetail } from "./schemas";

export interface TeamPerson {
  member: MemberListItem;
  role: MembershipRole;
}

export interface ProjectTeam {
  project: ProjectDetail;
  people: TeamPerson[];
}

// Memberships carry user ids only; names and avatars come from the roster.
// Leads first; people missing from the roster (inactive) are dropped.
export function withPeople(memberships: Membership[], roster: MemberListItem[]): TeamPerson[] {
  const byId = new Map(roster.map((member) => [member.id, member]));
  return memberships
    .flatMap((row) => {
      const member = byId.get(row.user);
      return member ? [{ member, role: row.role }] : [];
    })
    .sort((a, b) => Number(b.role === "Team_Lead") - Number(a.role === "Team_Lead"));
}

export const hasLead = (project: ProjectDetail): boolean =>
  project.members.some((row) => row.role === "Team_Lead");

export const projectsWithoutLead = (projects: ProjectDetail[]): ProjectDetail[] =>
  projects.filter((project) => project.project_status !== "Completed" && !hasLead(project));

export function idleMembers(roster: MemberListItem[], projects: ProjectDetail[]): MemberListItem[] {
  const busy = new Set(projects.flatMap((project) => project.members.map((row) => row.user)));
  return roster.filter((member) => member.status === "Active" && !busy.has(member.id));
}

export const projectTeams = (projects: ProjectDetail[], roster: MemberListItem[]): ProjectTeam[] =>
  projects
    .map((project) => ({ project, people: withPeople(project.members, roster) }))
    .filter((team) => team.people.length > 0);

// `skills` is free text in the API: "React, TypeScript" or one per line.
export const splitSkills = (skills: string): string[] => [
  ...new Set(
    skills
      .split(/[,\n]/)
      .map((skill) => skill.trim())
      .filter(Boolean),
  ),
];
```

- [ ] **Step 4: Run the tests and the type check**

Run: `bun run test src/server/api && bunx tsc --noEmit`
Expected: tests PASS, tsc exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/server/api
git commit -m "feat: add api resource modules and roster joins" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Login, logout, session and guards

**Files:**
- Create: `src/server/api/auth.ts`
- Modify: `src/server/auth/session-token.ts`, `src/server/auth/session-token.test.ts`, `proxy.ts` (one line, until Task 8)
- Rewrite: `src/server/auth/session.ts`, `src/server/auth/dal.ts`, `src/actions/auth.ts`
- Test: `src/server/auth/session.test.ts`, `src/actions/auth.test.ts`

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces:
  - `api/auth.ts` (proxy-safe, no `server-only`): `loginWithPassword(username, password): Promise<Tokens>`, `refreshTokens(refresh)`, `verifyAccess(access): Promise<boolean>`, `getAccountWithToken(access): Promise<Account>`, `logoutFromApi(access?, refresh?)`.
  - `session.ts`: `interface NewSession { access; refresh?; userId: number; role: UserRole }`, `startSession(session)`, `readSession()`, `readTokens()`, `endSession()`, `authSecret()`.
  - `dal.ts`: `requireRole(...roles: UserRole[])` (no roles = any signed-in user), `requireAdmin()`.
  - `actions/auth.ts`: `login` and `logout`, same names and `LoginState` shape as today, so `LoginForm` and `AdminNav` keep working unchanged.
  - `SessionPayload.role` becomes `UserRole` (`"Admin" | "Team_Lead" | "Developer"`).

- [ ] **Step 1: Write the failing tests**

`src/server/auth/session.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { endSession, readSession, startSession } from "./session";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

class FakeCookies {
  values = new Map<string, { value: string; options?: unknown }>();
  get = (name: string) => {
    const entry = this.values.get(name);
    return entry ? { name, value: entry.value } : undefined;
  };
  set = (name: string, value: string, options?: unknown) => {
    this.values.set(name, { value, options });
  };
  delete = (name: string) => {
    this.values.delete(name);
  };
}

const jwt = (exp: number) => `h.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.s`;

let jar: FakeCookies;

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret-test-secret-test-secret");
  jar = new FakeCookies();
  vi.mocked(cookies).mockResolvedValue(jar as unknown as Awaited<ReturnType<typeof cookies>>);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session", () => {
  it("keeps each token until its own exp and signs the role", async () => {
    const access = jwt(2_000_000_000);
    const refresh = jwt(2_000_086_400);
    await startSession({ access, refresh, userId: 7, role: "Developer" });
    expect(jar.values.get("mc_access")).toMatchObject({
      value: access,
      options: { httpOnly: true, sameSite: "lax", expires: new Date(2_000_000_000_000) },
    });
    expect(jar.values.get("mc_refresh")).toMatchObject({
      value: refresh,
      options: { expires: new Date(2_000_086_400_000) },
    });
    await expect(readSession()).resolves.toMatchObject({
      sub: "7",
      role: "Developer",
      exp: 2_000_086_400_000,
    });
  });

  it("ends every auth cookie", async () => {
    await startSession({ access: jwt(2_000_000_000), userId: 1, role: "Admin" });
    await endSession();
    expect([...jar.values.keys()]).toEqual([]);
  });
});
```

`src/actions/auth.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { getAccountWithToken, loginWithPassword } from "@/src/server/api/auth";
import { ApiError } from "@/src/server/api/errors";
import { startSession } from "@/src/server/auth/session";
import { login } from "./auth";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  }),
}));
vi.mock("@/src/server/api/auth", () => ({
  loginWithPassword: vi.fn(),
  getAccountWithToken: vi.fn(),
  logoutFromApi: vi.fn(),
}));
vi.mock("@/src/server/auth/session", () => ({
  startSession: vi.fn(),
  readTokens: vi.fn(),
  endSession: vi.fn(),
}));

const form = (login: string, password: string) => {
  const data = new FormData();
  data.set("login", login);
  data.set("password", password);
  return data;
};

const account = (role: "Admin" | "Developer", status: "Active" | "Inactive" = "Active") => ({
  id: 7,
  login: "anvar",
  role,
  status,
  first_name: "",
  last_name: "",
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("login", () => {
  it("validates before calling the API", async () => {
    await expect(login({}, form("", ""))).resolves.toMatchObject({
      fieldErrors: { login: "Введите логин", password: "Введите пароль" },
    });
    expect(loginWithPassword).not.toHaveBeenCalled();
  });

  it("reports wrong credentials", async () => {
    vi.mocked(loginWithPassword).mockRejectedValue(new ApiError("unauthorized", 401, "x"));
    await expect(login({}, form("anvar", "nope"))).resolves.toEqual({
      error: "Неверный логин или пароль.",
      login: "anvar",
    });
  });

  it("reports an unreachable server", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(loginWithPassword).mockRejectedValue(new ApiError("unavailable", 0, "x"));
    await expect(login({}, form("anvar", "pw"))).resolves.toMatchObject({
      error: "Сервер недоступен, попробуйте позже.",
    });
  });

  it("refuses inactive accounts without starting a session", async () => {
    vi.mocked(loginWithPassword).mockResolvedValue({ access: "a", refresh: "r" });
    vi.mocked(getAccountWithToken).mockResolvedValue(account("Developer", "Inactive"));
    await expect(login({}, form("anvar", "pw"))).resolves.toMatchObject({
      error: "Аккаунт отключён. Обратитесь к администратору.",
    });
    expect(startSession).not.toHaveBeenCalled();
  });

  it.each([
    ["Admin", "/admin"],
    ["Developer", "/account"],
  ] as const)("signs a %s in and sends them to %s", async (role, home) => {
    vi.mocked(loginWithPassword).mockResolvedValue({ access: "a", refresh: "r" });
    vi.mocked(getAccountWithToken).mockResolvedValue(account(role));
    await expect(login({}, form(" anvar ", "pw"))).rejects.toThrow(`NEXT_REDIRECT ${home}`);
    expect(loginWithPassword).toHaveBeenCalledWith("anvar", "pw");
    expect(startSession).toHaveBeenCalledWith({ access: "a", refresh: "r", userId: 7, role });
    expect(redirect).toHaveBeenCalledWith(home);
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `bun run test src/server/auth/session.test.ts src/actions/auth.test.ts`
Expected: FAIL — `startSession` / `getAccountWithToken` don't exist.

- [ ] **Step 3: Implement**

`src/server/api/auth.ts`:
```ts
import { isApiError } from "./errors";
import { request, requestNoContent } from "./http";
import { accountSchema, tokensSchema, type Account, type Tokens } from "./schemas";

// No `server-only`: proxy.ts refreshes and verifies tokens with these.

export const loginWithPassword = (username: string, password: string): Promise<Tokens> =>
  request("/auth/login/", tokensSchema, {
    method: "POST",
    body: { username, password },
    cache: "no-store",
  });

export const refreshTokens = (refresh: string): Promise<Tokens> =>
  request("/auth/login/refresh/", tokensSchema, { method: "POST", body: { refresh }, cache: "no-store" });

// true: the backend still accepts this access token.
export async function verifyAccess(access: string): Promise<boolean> {
  try {
    await requestNoContent("/auth/verify/", { token: access, cache: "no-store" });
    return true;
  } catch (error) {
    if (isApiError(error, "unauthorized")) return false;
    throw error;
  }
}

export const getAccountWithToken = (access: string): Promise<Account> =>
  request("/personal-account/", accountSchema, { token: access, cache: "no-store" });

export async function logoutFromApi(access: string | undefined, refresh: string | undefined): Promise<void> {
  await requestNoContent("/auth/logout/", {
    method: "POST",
    token: access,
    body: refresh ? { refresh } : {},
    cache: "no-store",
  });
}
```

`src/server/auth/session-token.ts`: replace the first line and the `role` type:
```ts
import type { UserRole } from "@/src/lib/api-enums";

export interface SessionPayload {
  sub: string;
  role: UserRole;
  exp: number;
}
```
In `src/server/auth/session-token.test.ts` change the payload line to:
```ts
const payload = { sub: "7", role: "Admin" as const, exp: 2_000 };
```

`src/server/auth/session.ts` (full rewrite):
```ts
import "server-only";
import { cookies } from "next/headers";
import type { UserRole } from "@/src/lib/api-enums";
import {
  ACCESS_COOKIE,
  AUTH_COOKIES,
  REFRESH_COOKIE,
  SESSION_COOKIE,
  authCookieOptions,
} from "./cookies";
import { jwtExpiresAt } from "./jwt";
import { signToken, verifyToken, type SessionPayload } from "./session-token";

// Only for a token without a readable `exp`.
const FALLBACK_TTL_MS = 8 * 60 * 60 * 1000;

export const authSecret = (): string => {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return value;
};

export interface NewSession {
  access: string;
  refresh?: string;
  userId: number;
  role: UserRole;
}

// mc_session lives as long as the refresh token: it's how proxy.ts and the
// pages know the role without asking the API.
export async function startSession({ access, refresh, userId, role }: NewSession): Promise<void> {
  const accessExp = jwtExpiresAt(access) ?? Date.now() + FALLBACK_TTL_MS;
  const refreshExp = (refresh ? jwtExpiresAt(refresh) : null) ?? accessExp;
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, authCookieOptions(accessExp));
  if (refresh) store.set(REFRESH_COOKIE, refresh, authCookieOptions(refreshExp));
  const session = await signToken({ sub: String(userId), role, exp: refreshExp }, authSecret());
  store.set(SESSION_COOKIE, session, authCookieOptions(refreshExp));
}

export async function readSession(): Promise<SessionPayload | null> {
  return verifyToken((await cookies()).get(SESSION_COOKIE)?.value, authSecret());
}

export async function readTokens(): Promise<{ access?: string; refresh?: string }> {
  const store = await cookies();
  return { access: store.get(ACCESS_COOKIE)?.value, refresh: store.get(REFRESH_COOKIE)?.value };
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  for (const name of AUTH_COOKIES) store.delete(name);
}
```

`src/server/auth/dal.ts` (full rewrite):
```ts
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { UserRole } from "@/src/lib/api-enums";
import { LOGIN_PATH } from "./routes";
import { readSession } from "./session";
import type { SessionPayload } from "./session-token";

// Our real guard; the backend re-checks every call anyway, and proxy.ts
// only redirects optimistically. No roles = any signed-in user.
export const requireRole = cache(async (...roles: UserRole[]): Promise<SessionPayload> => {
  const session = await readSession();
  if (!session || (roles.length > 0 && !roles.includes(session.role))) redirect(LOGIN_PATH);
  return session;
});

export const requireAdmin = (): Promise<SessionPayload> => requireRole("Admin");
```

`src/actions/auth.ts` (full rewrite):
```ts
"use server";

import { redirect } from "next/navigation";
import { getAccountWithToken, loginWithPassword, logoutFromApi } from "@/src/server/api/auth";
import { isApiError } from "@/src/server/api/errors";
import { LOGIN_PATH, homeFor } from "@/src/server/auth/routes";
import { endSession, readTokens, startSession } from "@/src/server/auth/session";

export interface LoginFieldErrors {
  login?: string;
  password?: string;
}

export interface LoginState {
  error?: string;
  fieldErrors?: LoginFieldErrors;
  // Echoed back so the login field survives React's post-action form reset.
  login?: string;
}

const MAX_LENGTH = 128;

const validate = (login: string, password: string): LoginFieldErrors => {
  const errors: LoginFieldErrors = {};
  if (!login) errors.login = "Введите логин";
  else if (login.length > MAX_LENGTH) errors.login = "Слишком длинный логин";
  if (!password) errors.password = "Введите пароль";
  else if (password.length > MAX_LENGTH) errors.password = "Слишком длинный пароль";
  return errors;
};

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rawLogin = formData.get("login");
  const rawPassword = formData.get("password");
  if (typeof rawLogin !== "string" || typeof rawPassword !== "string") {
    return { error: "Не удалось отправить форму. Обновите страницу и попробуйте снова." };
  }

  const loginValue = rawLogin.trim();
  const fieldErrors = validate(loginValue, rawPassword);
  if (fieldErrors.login || fieldErrors.password) return { fieldErrors, login: loginValue };

  let home: string;
  try {
    const tokens = await loginWithPassword(loginValue, rawPassword);
    const account = await getAccountWithToken(tokens.access);
    if (account.status === "Inactive") {
      return { error: "Аккаунт отключён. Обратитесь к администратору.", login: loginValue };
    }
    await startSession({
      access: tokens.access,
      refresh: tokens.refresh,
      userId: account.id,
      role: account.role,
    });
    home = homeFor(account.role);
  } catch (error) {
    if (isApiError(error, "unauthorized") || isApiError(error, "validation")) {
      return { error: "Неверный логин или пароль.", login: loginValue };
    }
    console.error("Login failed", error);
    return { error: "Сервер недоступен, попробуйте позже.", login: loginValue };
  }
  redirect(home);
}

export async function logout(): Promise<void> {
  const { access, refresh } = await readTokens();
  try {
    await logoutFromApi(access, refresh);
  } catch (error) {
    // The session ends here either way.
    console.error("API logout failed", error);
  }
  await endSession();
  redirect(LOGIN_PATH);
}
```

`proxy.ts`: until Task 8 replaces the file, change only the role literal:
```ts
  const isAdmin = session?.role === "Admin";
```

- [ ] **Step 4: Run all tests and the type check**

Run: `bun run test && bunx next typegen && bunx tsc --noEmit`
Expected: all tests PASS (old repository tests included), tsc exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/server/api/auth.ts src/server/auth src/actions/auth.ts src/actions/auth.test.ts proxy.ts
git commit -m "feat: sign in through the api with jwt cookies" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Proxy — token refresh and role redirects

**Files:**
- Create: `src/server/auth/proxy-decision.ts`
- Rewrite: `proxy.ts`
- Test: `src/server/auth/proxy-decision.test.ts`, `src/server/auth/proxy.test.ts`

**Interfaces:**
- Consumes: `refreshTokens`, `verifyAccess` (Task 7); cookie helpers, `jwtExpiresAt`, `homeFor`, `LOGIN_PATH` (Task 4); `signToken`, `verifyToken` (existing `session-token.ts`).
- Produces: `areaOf(pathname)`, `needsRefresh(accessExpiresAt, now)`, `decideAccess(area, role, hasAccess)`, `REFRESH_MARGIN_MS`, and the `proxy` export with matcher `["/admin/:path*", "/account/:path*", "/login"]`.

- [ ] **Step 1: Write the failing tests**

`src/server/auth/proxy-decision.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { areaOf, decideAccess, needsRefresh } from "./proxy-decision";

describe("areaOf", () => {
  it.each([
    ["/admin", "admin"],
    ["/admin/members/3", "admin"],
    ["/administrator", "other"],
    ["/account", "account"],
    ["/login", "login"],
    ["/", "other"],
  ] as const)("%s → %s", (path, area) => {
    expect(areaOf(path)).toBe(area);
  });
});

describe("needsRefresh", () => {
  it("refreshes a missing or nearly expired access token", () => {
    expect(needsRefresh(null, 0)).toBe(true);
    expect(needsRefresh(10_000, 0)).toBe(true);
    expect(needsRefresh(60_000, 0)).toBe(false);
  });
});

describe("decideAccess", () => {
  it.each([
    ["admin", "Admin", true, "allow"],
    ["admin", "Developer", true, "login"],
    ["admin", "Admin", false, "login"],
    ["admin", null, false, "login"],
    ["account", "Team_Lead", true, "allow"],
    ["account", null, false, "login"],
    ["login", "Admin", true, "verify"],
    ["login", null, false, "allow"],
    ["other", null, false, "allow"],
  ] as const)("%s as %s (access: %s) → %s", (area, role, hasAccess, kind) => {
    expect(decideAccess(area, role, hasAccess).kind).toBe(kind);
  });
});
```

`src/server/auth/proxy.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import type { UserRole } from "@/src/lib/api-enums";
import { refreshTokens, verifyAccess } from "@/src/server/api/auth";
import { ApiError } from "@/src/server/api/errors";
import { signToken } from "./session-token";

vi.mock("@/src/server/api/auth", () => ({ refreshTokens: vi.fn(), verifyAccess: vi.fn() }));

const SECRET = "test-secret-test-secret-test-secret";
const HOUR = 60 * 60 * 1000;
const jwt = (expiresAt: number) =>
  `h.${Buffer.from(JSON.stringify({ exp: Math.floor(expiresAt / 1000) })).toString("base64url")}.s`;

const call = (path: string, cookies: Record<string, string>) =>
  proxy(
    new NextRequest(`http://localhost${path}`, {
      headers: {
        cookie: Object.entries(cookies)
          .map(([name, value]) => `${name}=${value}`)
          .join("; "),
      },
    }),
  );

const signedIn = async (role: UserRole, accessExpiresAt = Date.now() + HOUR) => ({
  mc_access: jwt(accessExpiresAt),
  mc_refresh: jwt(Date.now() + 24 * HOUR),
  mc_session: await signToken({ sub: "7", role, exp: Date.now() + 24 * HOUR }, SECRET),
});

const location = (response: Response) => response.headers.get("location");

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("proxy", () => {
  it("sends anonymous visitors of /admin to /login", async () => {
    expect(location(await call("/admin", {}))).toBe("http://localhost/login");
  });

  it("lets an admin with a fresh token through untouched", async () => {
    const response = await call("/admin/projects", await signedIn("Admin"));
    expect(location(response)).toBeNull();
    expect(refreshTokens).not.toHaveBeenCalled();
    expect(response.cookies.getAll()).toEqual([]);
  });

  it("sends a developer away from /admin", async () => {
    expect(location(await call("/admin", await signedIn("Developer")))).toBe("http://localhost/login");
  });

  it("refreshes an expired access token for this very request", async () => {
    const fresh = jwt(Date.now() + HOUR);
    vi.mocked(refreshTokens).mockResolvedValue({ access: fresh });
    const response = await call("/account", await signedIn("Developer", Date.now() - 1_000));
    expect(location(response)).toBeNull();
    expect(response.cookies.get("mc_access")?.value).toBe(fresh);
    expect(response.headers.get("x-middleware-request-cookie")).toContain(fresh);
  });

  it("drops a session whose refresh is rejected", async () => {
    vi.mocked(refreshTokens).mockRejectedValue(new ApiError("unauthorized", 401, "x"));
    const response = await call("/admin", await signedIn("Admin", Date.now() - 1_000));
    expect(location(response)).toBe("http://localhost/login");
    expect(response.cookies.get("mc_session")?.value).toBe("");
  });

  it("keeps the session when the API is unreachable during refresh", async () => {
    vi.mocked(refreshTokens).mockRejectedValue(new ApiError("unavailable", 0, "x"));
    const response = await call("/admin", await signedIn("Admin", Date.now() + 10_000));
    expect(location(response)).toBeNull();
    expect(response.cookies.getAll()).toEqual([]);
  });

  it("sends a signed-in user from /login to their home after verifying", async () => {
    vi.mocked(verifyAccess).mockResolvedValue(true);
    expect(location(await call("/login", await signedIn("Team_Lead")))).toBe("http://localhost/account");
  });

  it("shows the form when the token was revoked", async () => {
    vi.mocked(verifyAccess).mockResolvedValue(false);
    const response = await call("/login", await signedIn("Admin"));
    expect(location(response)).toBeNull();
    expect(response.cookies.get("mc_access")?.value).toBe("");
  });

  it("ignores a forged session cookie", async () => {
    const response = await call("/admin", { mc_access: jwt(Date.now() + HOUR), mc_session: "forged.sig" });
    expect(location(response)).toBe("http://localhost/login");
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `bun run test src/server/auth/proxy-decision.test.ts src/server/auth/proxy.test.ts`
Expected: FAIL — `./proxy-decision` missing; the old proxy redirects differently.

- [ ] **Step 3: Implement**

Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` ("Setting Headers", "Using Cookies") first. The request-cookie forwarding below relies on `NextResponse.next({ request: { headers } })`.

`src/server/auth/proxy-decision.ts`:
```ts
import type { UserRole } from "@/src/lib/api-enums";

export const REFRESH_MARGIN_MS = 30_000;

export type Area = "admin" | "account" | "login" | "other";

export function areaOf(pathname: string): Area {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/account" || pathname.startsWith("/account/")) return "account";
  if (pathname === "/login") return "login";
  return "other";
}

// Refresh a missing or nearly expired access token (the caller checks that
// a refresh token exists).
export const needsRefresh = (accessExpiresAt: number | null, now: number): boolean =>
  accessExpiresAt === null || accessExpiresAt - now < REFRESH_MARGIN_MS;

export type Access =
  | { kind: "allow" }
  | { kind: "login" }
  // Signed in and on /login: confirm the token before sending them home.
  | { kind: "verify" };

// role: from a valid mc_session; hasAccess: an access token is present.
export function decideAccess(area: Area, role: UserRole | null, hasAccess: boolean): Access {
  const signedIn = role !== null && hasAccess;
  switch (area) {
    case "admin":
      return signedIn && role === "Admin" ? { kind: "allow" } : { kind: "login" };
    case "account":
      return signedIn ? { kind: "allow" } : { kind: "login" };
    case "login":
      return signedIn ? { kind: "verify" } : { kind: "allow" };
    default:
      return { kind: "allow" };
  }
}
```

`proxy.ts` (full rewrite):
```ts
import { NextResponse, type NextRequest } from "next/server";
import { refreshTokens, verifyAccess } from "@/src/server/api/auth";
import { isApiError } from "@/src/server/api/errors";
import {
  ACCESS_COOKIE,
  AUTH_COOKIES,
  REFRESH_COOKIE,
  SESSION_COOKIE,
  authCookieOptions,
} from "@/src/server/auth/cookies";
import { jwtExpiresAt } from "@/src/server/auth/jwt";
import { areaOf, decideAccess, needsRefresh } from "@/src/server/auth/proxy-decision";
import { LOGIN_PATH, homeFor } from "@/src/server/auth/routes";
import { signToken, verifyToken, type SessionPayload } from "@/src/server/auth/session-token";

interface CookieWrite {
  name: string;
  value: string;
  expiresAt: number;
}

const secret = () => process.env.AUTH_SECRET ?? "";

// "expired": the backend refused the refresh token. null: it couldn't be
// reached, so keep the cookies and let the page show its own error.
async function refreshSession(
  refresh: string,
  session: SessionPayload,
): Promise<CookieWrite[] | "expired" | null> {
  try {
    const tokens = await refreshTokens(refresh);
    const writes: CookieWrite[] = [
      { name: ACCESS_COOKIE, value: tokens.access, expiresAt: jwtExpiresAt(tokens.access) ?? session.exp },
    ];
    if (tokens.refresh) {
      const exp = jwtExpiresAt(tokens.refresh) ?? session.exp;
      writes.push(
        { name: REFRESH_COOKIE, value: tokens.refresh, expiresAt: exp },
        { name: SESSION_COOKIE, value: await signToken({ ...session, exp }, secret()), expiresAt: exp },
      );
    }
    return writes;
  } catch (error) {
    return isApiError(error, "unauthorized") || isApiError(error, "validation") ? "expired" : null;
  }
}

// null: the API couldn't answer.
async function stillValid(access: string): Promise<boolean | null> {
  try {
    return await verifyAccess(access);
  } catch {
    return null;
  }
}

// Rebuilds the Cookie header so this very render already sees refreshed or
// cleared cookies.
function forward(request: NextRequest, jar: Map<string, string>): NextResponse {
  const headers = new Headers(request.headers);
  headers.set(
    "cookie",
    [...jar].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; "),
  );
  return NextResponse.next({ request: { headers } });
}

// Optimistic only: requireRole() in pages and actions is our real guard,
// and the backend checks every call again.
export async function proxy(request: NextRequest) {
  const now = Date.now();
  const area = areaOf(request.nextUrl.pathname);
  const jar = new Map(request.cookies.getAll().map((cookie) => [cookie.name, cookie.value]));
  const session = await verifyToken(jar.get(SESSION_COOKIE), secret(), now);
  // Auth cookies without a valid signed session are leftovers: drop them.
  let clear = !session && AUTH_COOKIES.some((name) => jar.has(name));
  let writes: CookieWrite[] = [];

  const access = jar.get(ACCESS_COOKIE);
  const refresh = jar.get(REFRESH_COOKIE);
  if (session && refresh && needsRefresh(access ? jwtExpiresAt(access) : null, now)) {
    const result = await refreshSession(refresh, session);
    if (result === "expired") clear = true;
    else if (result) writes = result;
  }

  for (const { name, value } of writes) jar.set(name, value);
  if (clear) AUTH_COOKIES.forEach((name) => jar.delete(name));

  const role = clear ? null : (session?.role ?? null);
  const decision = decideAccess(area, role, jar.has(ACCESS_COOKIE));
  let target = decision.kind === "login" ? LOGIN_PATH : null;

  if (decision.kind === "verify" && role) {
    // Without this check a revoked token loops: page → /login → back.
    const valid = await stillValid(jar.get(ACCESS_COOKIE) ?? "");
    if (valid) target = homeFor(role);
    if (valid === false) {
      clear = true;
      AUTH_COOKIES.forEach((name) => jar.delete(name));
    }
  }

  const response = target ? NextResponse.redirect(new URL(target, request.url)) : forward(request, jar);
  if (clear) AUTH_COOKIES.forEach((name) => response.cookies.delete(name));
  else {
    for (const { name, value, expiresAt } of writes) {
      response.cookies.set(name, value, authCookieOptions(expiresAt));
    }
  }
  return response;
}

export const config = { matcher: ["/admin/:path*", "/account/:path*", "/login"] };
```

- [ ] **Step 4: Run all tests and the type check**

Run: `bun run test && bunx tsc --noEmit`
Expected: PASS, tsc exits 0. If only the `x-middleware-request-cookie` assertion fails, print `[...response.headers]` in that test, look for the header Next 16 actually uses to carry overridden request headers, and assert on that one. Don't drop the assertion: it checks the "same request" half of the refresh contract.

- [ ] **Step 5: Commit**

```bash
git add proxy.ts src/server/auth/proxy-decision.ts src/server/auth/proxy-decision.test.ts src/server/auth/proxy.test.ts
git commit -m "feat: refresh jwt cookies and redirect by role in proxy" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: `/account` placeholder

**Files:**
- Create: `app/(account)/layout.tsx`, `app/(account)/account/page.tsx`, `src/components/AccountPlaceholder.tsx`, `src/components/AccountPlaceholder.module.scss`
- Modify: `app/(auth)/layout.tsx` (stale comment)

**Interfaces:**
- Consumes: `requireRole` (Task 7), `getMyAccount` (Task 6), `fullName` (Task 1), `logout` (Task 7).

- [ ] **Step 1: Implement**

`app/(account)/layout.tsx`:
```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Кабинет — Motion Community",
  robots: { index: false, follow: false },
};

// Minimal on purpose: the full cabinet (spec 2) gets its own shell here.
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <main>{children}</main>;
}
```

`app/(account)/account/page.tsx`:
```tsx
import AccountPlaceholder from "@/src/components/AccountPlaceholder";
import { fullName } from "@/src/lib/people";
import { getMyAccount } from "@/src/server/api/account";
import { requireRole } from "@/src/server/auth/dal";

const Page = async () => {
  await requireRole();
  const account = await getMyAccount();
  return <AccountPlaceholder name={fullName(account, account.login)} />;
};

export default Page;
```

`src/components/AccountPlaceholder.tsx`:
```tsx
import { FC } from "react";
import Button from "@/src/ui/Button";
import { logout } from "@/src/actions/auth";
import scss from "./AccountPlaceholder.module.scss";

// Where Team Leads and Developers land after login until the cabinet
// (spec 2) exists.
const AccountPlaceholder: FC<{ name: string }> = ({ name }) => (
  <section className={scss.page}>
    <div className={scss.card}>
      <p className={scss.eyebrow}>Личный кабинет</p>
      <h1 className={scss.title}>Здравствуйте, {name}</h1>
      <p className={scss.text}>
        Личный кабинет скоро появится: здесь можно будет заполнить профиль,
        опыт, образование и сертификаты.
      </p>
      <div className={scss.actions}>
        <Button href="/" variant="ghost">
          На сайт
        </Button>
        <form action={logout}>
          <Button type="submit" variant="primary">
            Выйти
          </Button>
        </form>
      </div>
    </div>
  </section>
);

export default AccountPlaceholder;
```

`src/components/AccountPlaceholder.module.scss`:
```scss
.page {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: 24px 16px;
  background: var(--color-ink);
}

.card {
  width: min(100%, 520px);
  padding: 32px;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface);
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.title {
  margin-top: 12px;
  font-family: var(--font-display);
  font-size: clamp(24px, 4vw, 32px);
  line-height: 1.2;
  color: var(--color-paper);
}

.text {
  margin-top: 12px;
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-mist);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}
```

`app/(auth)/layout.tsx`: replace the comment with
```tsx
// No site header/footer here: auth is its own section, and after login
// the user lands in /admin (Admin) or /account (Team Lead, Developer).
```

- [ ] **Step 2: Type check and smoke test**

Run: `bunx next typegen && bunx tsc --noEmit`
Expected: exit 0.

Start the dev server in the background with `bun run dev`. Then:
```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/account
```
Expected: `307 http://localhost:3000/login`. Stop the dev server afterwards.

- [ ] **Step 3: Commit**

```bash
git add "app/(account)" "app/(auth)/layout.tsx" src/components/AccountPlaceholder.tsx src/components/AccountPlaceholder.module.scss
git commit -m "feat: add account placeholder for members" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Image fallbacks and the home page

**Files:**
- Create: `src/ui/Avatar.tsx`, `src/ui/Avatar.module.scss`, `src/ui/ProjectCover.tsx`, `src/ui/ProjectCover.module.scss`
- Modify: `src/components/Hero.tsx`, `src/components/hero-sections/Stats.tsx`, `src/components/hero-sections/Portfolio.tsx`

**Interfaces:**
- Consumes: `getStats`, `getProjects` (Task 6); `plural`, `initials` (Task 1); `PROJECT_STATUS_LABELS` (Task 1); types `Stats`, `ProjectListItem` (Task 3).
- Produces (both fill their positioned parent; `imageClassName` styles only the photo):
  - `<Avatar src={string | null} name imageClassName? eager? />`: photo or initials;
  - `<ProjectCover src={string | null} name bare? imageClassName? />`: preview or a gradient title card; `bare` hides the name where the card already captions it.

- [ ] **Step 1: Add the fallbacks**

`src/ui/Avatar.tsx`:
```tsx
import { FC } from "react";
import { initials } from "@/src/lib/people";
import scss from "./Avatar.module.scss";

interface AvatarProps {
  src: string | null;
  name: string;
  imageClassName?: string;
  // Above-the-fold portraits load right away.
  eager?: boolean;
}

// Fills its positioned parent: the API photo when there is one, otherwise
// the person's initials, scaled to the box. API media lives on the backend
// host, so a plain <img> like the project previews.
const Avatar: FC<AvatarProps> = ({ src, name, imageClassName, eager }) =>
  src ? (
    <img
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      className={`${scss.image} ${imageClassName ?? ""}`}
    />
  ) : (
    <span className={scss.fallback} aria-hidden="true">
      <span className={scss.fallback__text}>{initials(name)}</span>
    </span>
  );

export default Avatar;
```

`src/ui/Avatar.module.scss`:
```scss
.image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

// container-type: size lets the initials scale with any box, from the
// 28px admin avatar stack to the profile portrait.
.fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  container-type: size;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 24%, var(--color-surface)),
    var(--color-surface-2)
  );
  color: var(--color-accent-soft);
}

.fallback__text {
  font-family: var(--font-display);
  font-size: 36cqmin;
  line-height: 1;
  letter-spacing: 0.02em;
}
```

`src/ui/ProjectCover.tsx`:
```tsx
import { FC } from "react";
import scss from "./ProjectCover.module.scss";

interface ProjectCoverProps {
  src: string | null;
  name: string;
  // The surrounding card already captions the image: drop the name.
  bare?: boolean;
  imageClassName?: string;
}

// Fills its positioned parent. No project has a preview_image yet (the API
// has no upload), so a gradient title card stands in.
const ProjectCover: FC<ProjectCoverProps> = ({ src, name, bare, imageClassName }) =>
  src ? (
    <img
      src={src}
      alt={`${name} — превью`}
      loading="lazy"
      className={`${scss.image} ${imageClassName ?? ""}`}
    />
  ) : (
    <span className={scss.fallback} role="img" aria-label={`${name} — превью`}>
      {!bare && <span className={scss.fallback__name}>{name}</span>}
    </span>
  );

export default ProjectCover;
```

`src/ui/ProjectCover.module.scss`:
```scss
.image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 8%;
  container-type: size;
  background:
    radial-gradient(
      120% 90% at 85% 10%,
      color-mix(in srgb, var(--color-accent) 35%, transparent),
      transparent 60%
    ),
    linear-gradient(160deg, var(--color-surface-2), var(--color-ink));
}

.fallback__name {
  font-family: var(--font-display);
  font-size: clamp(12px, 11cqmin, 44px);
  line-height: 1.1;
  color: var(--color-paper);
  overflow-wrap: anywhere;
}
```

- [ ] **Step 2: Home data**

In `src/components/Hero.tsx`, replace
`import { getPublicProjects } from "@/src/server/queries/public";` with:
```tsx
import { getProjects } from "@/src/server/api/projects";
import { getStats } from "@/src/server/api/stats";
```
Then replace the body of `Home` up to `<Pillars />` with:
```tsx
const Home = async () => {
  const [stats, projects] = await Promise.all([getStats(), getProjects()]);
  return (
    <div>
      <Welcome />
      <Stats stats={stats} />
      <ServicesPreview />
      {projects.length > 0 && <Portfolio projects={projects} />}
```

- [ ] **Step 3: Stats from `/stats/`**

Replace `src/components/hero-sections/Stats.tsx`. Keep `ICON_PROPS`, the `members` and `projects` icons and the section markup as they are:
```tsx
"use client";

import { FC, ReactNode } from "react";
import { useCountUp } from "@/src/hooks/use-count-up";
import { plural } from "@/src/lib/plural";
import type { Stats as StatsData } from "@/src/server/api/schemas";
import scss from "./Stats.module.scss";

type StatId = "members" | "projects" | "companies";

interface StatItemProps {
  id: StatId;
  value: number;
  label: string;
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ICONS: Record<StatId, ReactNode> = {
  members: (
    <svg {...ICON_PROPS}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.7-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
      <circle cx="17.5" cy="9" r="2.2" />
      <path d="M16.2 14.2c2.1.5 3.4 1.9 3.8 4.1" />
    </svg>
  ),
  projects: (
    <svg {...ICON_PROPS}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  ),
  companies: (
    <svg {...ICON_PROPS}>
      <path d="M4 20V6.5L12 3l8 3.5V20" />
      <path d="M9 20v-5h6v5" />
      <path d="M8 9h.01M12 9h.01M16 9h.01M8 12.5h.01M16 12.5h.01" />
    </svg>
  ),
};

const StatItem: FC<StatItemProps> = ({ id, value, label }) => {
  const { ref, value: shown } = useCountUp(value);

  return (
    <div className={scss.stat}>
      <span className={scss.stat__icon}>{ICONS[id]}</span>
      <div className={scss.stat__body}>
        <span ref={ref} className={scss.stat__value}>
          {shown}
        </span>
        <span className={scss.stat__label}>{label}</span>
      </div>
    </div>
  );
};

// Live numbers from GET /stats/, shown exactly.
const Stats: FC<{ stats: StatsData }> = ({ stats }) => {
  const items: StatItemProps[] = [
    {
      id: "members",
      value: stats.members_count,
      label: plural(stats.members_count, "участник", "участника", "участников"),
    },
    {
      id: "projects",
      value: stats.projects_count,
      label: plural(stats.projects_count, "проект", "проекта", "проектов"),
    },
    {
      id: "companies",
      value: stats.companies_count,
      label: plural(stats.companies_count, "компания", "компании", "компаний"),
    },
  ];

  return (
    <section className={scss.stats}>
      <div className={`container ${scss.stats__inner}`}>
        <div className={scss.stats__intro}>
          <span className={scss.stats__eyebrow}>Сообщество в цифрах</span>
          <p className={scss.stats__lead}>
            Каждый в сообществе проходит реальные проекты и ревью тимлидов —
            поэтому мы уверены, кого рекомендуем.
          </p>
        </div>

        <div className={scss.stats__grid}>
          {items.map((item) => (
            <StatItem key={item.id} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
```

- [ ] **Step 4: Portfolio on `ProjectListItem`**

In `src/components/hero-sections/Portfolio.tsx`:

1. Replace the import `import { CATEGORY_LABELS, type Project } from "@/src/data/projects";` with:
```tsx
import ProjectCover from "@/src/ui/ProjectCover";
import { PROJECT_STATUS_LABELS } from "@/src/lib/api-labels";
import type { ProjectListItem } from "@/src/server/api/schemas";
```
2. In `ProjectFace`:
   - type the prop as `project: ProjectListItem`;
   - replace the `<img … className={scss.card__image} />` with
     `<ProjectCover src={project.preview_image} name={project.name} bare imageClassName={scss.card__image} />`;
   - replace the label text `Featured project` with `{project.category}`.
3. Replace `ProjectPhoto` with:
```tsx
// ≤1024px: just the cover, no browser-chrome framing. The name sits on the
// image over a readable gradient scrim; the list endpoint has no
// description, so the CTA leads to the project page for the rest.
const ProjectPhoto: FC<{ project: ProjectListItem }> = ({ project }) => (
  <>
    <ProjectCover
      src={project.preview_image}
      name={project.name}
      bare
      imageClassName={scss.photo__image}
    />

    <div className={scss.photo__overlay} />

    <div className={scss.photo__caption}>
      <h3 className={scss.photo__name}>{project.name}</h3>
      <p className={scss.photo__description}>{project.category}</p>

      {/* Stops the tap reaching the drag handle around it — otherwise the
          swipe gesture claims the pointer and the link never gets a
          click. */}
      <div onPointerDown={(e) => e.stopPropagation()}>
        <Button
          href={`/projects/${project.id}`}
          variant="primary"
          className={scss.photo__cta}
        >
          Смотреть проект
        </Button>
      </div>
    </div>
  </>
);
```
4. Above `const Portfolio`:
   - change the comment to `// Every project from GET /projects/ — the API has no «featured» flag.`
   - type the props as `FC<{ projects: ProjectListItem[] }>`.
5. Change the heading text `Флагманские проекты` to `Проекты сообщества`.
6. In the `portfolio__info` block, replace everything from `<div className={scss.portfolio__meta}>` down to the closing `</Button>` with:
```tsx
              <div className={scss.portfolio__meta}>
                <span>{project.category}</span>
                <span>{PROJECT_STATUS_LABELS[project.project_status]}</span>
              </div>

              <h3 className={scss.portfolio__name}>{project.name}</h3>

              <Button
                href={`/projects/${project.id}`}
                variant="ghost"
                className={scss.portfolio__cta}
              >
                Смотреть проект
              </Button>
```
7. Key by id, not name: `key={project.name}` → `key={project.id}` (twice), `key={p.name}` → `key={p.id}` (twice).

- [ ] **Step 5: Type check and look at it**

Run: `bunx next typegen && bunx tsc --noEmit`
Expected: exit 0.

With `bun run dev` running:
```bash
curl -s http://localhost:3000/ | grep -o -E 'компани[а-я]+|Motion LMS Platform' | sort -u
```
Expected: one plural form of «компания» and `Motion LMS Platform`.

Open http://localhost:3000/ and check:
- the portfolio stack shows gradient covers;
- the dots and the mobile slider (375px) still work;
- stats count up to the API numbers.

- [ ] **Step 6: Commit**

```bash
git add src/ui/Avatar.tsx src/ui/Avatar.module.scss src/ui/ProjectCover.tsx src/ui/ProjectCover.module.scss src/components/Hero.tsx src/components/hero-sections/Stats.tsx src/components/hero-sections/Portfolio.tsx
git commit -m "feat: show live stats and projects on the home page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: `/projects` list

**Files:**
- Modify: `app/(site)/projects/page.tsx`, `src/components/Projects.tsx`, `src/components/projects-sections/Header.tsx`, `src/components/projects-sections/Grid.tsx`, `src/components/projects-sections/EditorialList.tsx`

**Interfaces:**
- Consumes: `getProjects` (Task 6), `ProjectCover` (Task 10), project status labels and tones (Task 1).

- [ ] **Step 1: Page data**

`app/(site)/projects/page.tsx`:
- replace the `getPublicProjects` import with `import { getProjects } from "@/src/server/api/projects";`;
- set the page to:
```tsx
const Page = async () => <Projects projects={await getProjects()} />;
```

- [ ] **Step 2: Filters from API values**

`src/components/Projects.tsx` (full rewrite):
```tsx
"use client";

import { FC, useMemo, useState } from "react";
import Header from "@/src/components/projects-sections/Header";
import Grid from "@/src/components/projects-sections/Grid";
import EditorialList from "@/src/components/projects-sections/EditorialList";
import type { ProjectStatus } from "@/src/lib/api-enums";
import type { ProjectListItem } from "@/src/server/api/schemas";

const Projects: FC<{ projects: ProjectListItem[] }> = ({ projects }) => {
  // null = all. Categories are free text in the API, so the tabs come
  // from the data itself.
  const [category, setCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const categories = [...new Set(projects.map((project) => project.category))];

  const visible = useMemo(
    () =>
      projects.filter(
        (project) =>
          (category === null || project.category === category) &&
          (status === null || project.project_status === status),
      ),
    [projects, category, status],
  );

  return (
    <div>
      <Header
        categories={categories}
        category={category}
        onCategoryChange={setCategory}
        status={status}
        onStatusChange={setStatus}
      />
      <Grid projects={visible} />
      <EditorialList projects={visible} />
    </div>
  );
};

export default Projects;
```

`src/components/projects-sections/Header.tsx` (full rewrite, same markup and classes):
```tsx
"use client";

import { FC } from "react";
import { motion } from "motion/react";
import { springs } from "@/src/lib/motion-tokens";
import type { ProjectStatus } from "@/src/lib/api-enums";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import scss from "./Header.module.scss";

// Completed first — "готовые проекты" is the most likely thing someone
// filters for.
const STATUS_ORDER: ProjectStatus[] = ["Completed", "In_progress", "Planned", "Paused"];

interface HeaderProps {
  categories: string[];
  category: string | null;
  onCategoryChange: (category: string | null) => void;
  status: ProjectStatus | null;
  onStatusChange: (status: ProjectStatus | null) => void;
}

const Header: FC<HeaderProps> = ({
  categories,
  category,
  onCategoryChange,
  status,
  onStatusChange,
}) => {
  const tabs: { key: string | null; label: string }[] = [
    { key: null, label: "Все" },
    ...categories.map((item) => ({ key: item, label: item })),
  ];
  const statusTabs: { key: ProjectStatus | null; label: string }[] = [
    { key: null, label: "Все статусы" },
    ...STATUS_ORDER.map((key) => ({ key, label: PROJECT_STATUS_LABELS[key] })),
  ];

  return (
    <div className={`container ${scss.header}`}>
      <span className={scss.header__eyebrow}>Portfolio</span>
      <h1 className={scss.header__title}>Все проекты</h1>
      <p className={scss.header__subtitle}>
        Проекты, которые сообщество делает для себя, и проекты, которые мы
        берём в разработку на заказ.
      </p>

      <div className={scss.header__tabs} role="group" aria-label="Фильтр по категории">
        {tabs.map((item) => {
          const active = category === item.key;
          return (
            <button
              key={item.key ?? "all"}
              type="button"
              className={scss.tab}
              aria-pressed={active}
              onClick={() => onCategoryChange(item.key)}
            >
              {active && (
                <motion.span
                  layoutId="projects-filter-pill"
                  className={scss.tab__pill}
                  transition={springs.snappy}
                />
              )}
              <span className={`${scss.tab__label} ${active ? scss["tab__label--active"] : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className={scss.header__statusTabs} role="group" aria-label="Фильтр по статусу">
        {statusTabs.map((item) => {
          const tone = item.key ? PROJECT_STATUS_TONE[item.key] : null;
          return (
            <button
              key={item.key ?? "all"}
              type="button"
              className={`${scss.statusTab} ${tone ? scss[`statusTab--${tone}`] : ""}`}
              aria-pressed={status === item.key}
              onClick={() => onStatusChange(item.key)}
            >
              {tone && <span className={scss.statusTab__dot} aria-hidden="true" />}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Header;
```

- [ ] **Step 3: Grid and editorial list**

`src/components/projects-sections/Grid.tsx`:
- Replace the `@/src/data/projects` import with:
```tsx
import ProjectCover from "@/src/ui/ProjectCover";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import type { ProjectListItem } from "@/src/server/api/schemas";
```
- Replace `ProjectCard` with:
```tsx
const ProjectCard: FC<{ project: ProjectListItem }> = ({ project }) => (
  <motion.div
    layout
    variants={cardVariants}
    exit={{
      opacity: 0,
      y: motionTokens.distance.sm,
      transition: { duration: motionTokens.duration.fast },
    }}
    className={scss.card}
  >
    <Link href={`/projects/${project.id}`} className={scss.card__link}>
      <div className={scss.card__photo}>
        <ProjectCover src={project.preview_image} name={project.name} imageClassName={scss.card__image} />
        <span
          className={`${scss.card__status} ${scss[`card__status--${PROJECT_STATUS_TONE[project.project_status]}`]}`}
        >
          {PROJECT_STATUS_LABELS[project.project_status]}
        </span>
      </div>

      <div className={scss.card__body}>
        <div className={scss.card__meta}>
          <span>{project.category}</span>
        </div>
        <h3 className={scss.card__name}>{project.name}</h3>
      </div>
    </Link>
  </motion.div>
);
```
- In `Grid`: `FC<{ projects: ProjectListItem[] }>` and `key={project.id}`.

`src/components/projects-sections/EditorialList.tsx`:
- Replace the `@/src/data/projects` import with the same three imports as Grid.
- Props: `FC<{ projects: ProjectListItem[] }>`.
- State: `useState<number | null>(null)`.
- `hoveredProject`: `projects.find((project) => project.id === hovered)`.
- Every `project.slug` (key, href, `data-dimmed`, `onMouseEnter`, active-name check): use `project.id`; hrefs become `/projects/${project.id}`.
- Replace the `row__meta` content with:
```tsx
              <span
                className={`${scss.status} ${scss[`status--${PROJECT_STATUS_TONE[project.project_status]}`]}`}
              >
                {PROJECT_STATUS_LABELS[project.project_status]}
              </span>
              <span>{project.category}</span>
```
- In the hover preview: `key={hoveredProject.id}`, and replace the `<img … className={scss.preview__image} />` with
  `<ProjectCover src={hoveredProject.preview_image} name={hoveredProject.name} imageClassName={scss.preview__image} />`.

- [ ] **Step 4: Type check and look at it**

Run: `bunx next typegen && bunx tsc --noEmit`
Expected: exit 0.

With the dev server running, open http://localhost:3000/projects and check:
- the tabs read «Все, Education, Web, Mobile, Analytics, E-commerce»;
- status filters narrow the list;
- cards and the desktop hover preview show gradient covers.

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/projects/page.tsx" src/components/Projects.tsx src/components/projects-sections/Header.tsx src/components/projects-sections/Grid.tsx src/components/projects-sections/EditorialList.tsx
git commit -m "feat: list projects from the api with category tabs" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: `/projects/[id]` detail

**Files:**
- Move: `app/(site)/projects/[slug]/page.tsx` → `app/(site)/projects/[id]/page.tsx`
- Modify: `src/components/projects-sections/ProjectDetail.tsx`, `src/components/projects-sections/TeamSection.tsx`, `src/components/projects-sections/HeroImage.tsx`, `src/components/projects-sections/HeroImage.module.scss`

**Interfaces:**
- Consumes: `getProject`, `getProjects`, `getPublicRoster`, `withPeople`, `TeamPerson` (Task 6); `parseId`, `fullName`, labels (Task 1); `Avatar`, `ProjectCover` (Task 10).

- [ ] **Step 1: Route**

```bash
git mv "app/(site)/projects/[slug]" "app/(site)/projects/[id]"
```

`app/(site)/projects/[id]/page.tsx` (full rewrite):
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetail from "@/src/components/projects-sections/ProjectDetail";
import { parseId } from "@/src/lib/route-id";
import { withPeople } from "@/src/server/api/joins";
import { getPublicRoster } from "@/src/server/api/members";
import { getProject, getProjects } from "@/src/server/api/projects";

const load = async (rawId: string) => {
  const id = parseId(rawId);
  return id === null ? null : getProject(id);
};

export async function generateMetadata({
  params,
}: PageProps<"/projects/[id]">): Promise<Metadata> {
  const project = await load((await params).id);
  if (!project) return {};
  return {
    title: `${project.name} — Motion Community`,
    description: project.description || undefined,
  };
}

const Page = async ({ params }: PageProps<"/projects/[id]">) => {
  const project = await load((await params).id);
  if (!project) notFound();

  const [projects, roster] = await Promise.all([getProjects(), getPublicRoster()]);
  const index = projects.findIndex((item) => item.id === project.id);
  const count = projects.length;
  // Wraps around; a single project, or one the cached list doesn't have
  // yet, gets no pager.
  const adjacent =
    index === -1 || count < 2
      ? null
      : { prev: projects[(index - 1 + count) % count], next: projects[(index + 1) % count] };

  return (
    <ProjectDetail project={project} team={withPeople(project.members, roster)} adjacent={adjacent} />
  );
};

export default Page;
```

- [ ] **Step 2: Detail view**

`src/components/projects-sections/ProjectDetail.tsx` (full rewrite, same classes):
```tsx
import { FC } from "react";
import Link from "next/link";
import Button from "@/src/ui/Button";
import ArrowIcon from "@/src/ui/ArrowIcon";
import HeroImage from "./HeroImage";
import TeamSection from "./TeamSection";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import type { TeamPerson } from "@/src/server/api/joins";
import type {
  ProjectDetail as ProjectDetailData,
  ProjectListItem,
} from "@/src/server/api/schemas";
import scss from "./ProjectDetail.module.scss";

// Server Component: only HeroImage and TeamSection carry a small client
// boundary (scroll parallax and scroll reveal).
interface ProjectDetailProps {
  project: ProjectDetailData;
  team: TeamPerson[];
  adjacent: { prev: ProjectListItem; next: ProjectListItem } | null;
}

const ProjectDetail: FC<ProjectDetailProps> = ({ project, team, adjacent }) => {
  const hasLinks = Boolean(project.demo_url || project.github_url);
  const tone = PROJECT_STATUS_TONE[project.project_status];

  return (
    <article className={scss.detail}>
      <div className={`container ${scss.detail__inner}`}>
        <Link href="/projects" className={scss.detail__back}>
          <ArrowIcon direction="left" />
          Все проекты
        </Link>

        <div className={scss.detail__header}>
          <div className={scss.detail__meta}>
            <span className={`${scss.status} ${scss[`status--${tone}`]}`}>
              {PROJECT_STATUS_LABELS[project.project_status]}
            </span>
            <span>{project.category}</span>
            <span>{project.created_at.slice(0, 4)}</span>
          </div>

          <h1 className={scss.detail__name}>
            <span className={scss.shine}>{project.name}</span>
          </h1>
          {project.description && (
            <p className={scss.detail__description}>{project.description}</p>
          )}
        </div>

        <HeroImage src={project.preview_image} name={project.name} />

        <div className={scss.detail__section}>
          <span className={scss.detail__sectionLabel}>Команда проекта</span>
          {team.length > 0 ? (
            <TeamSection people={team} />
          ) : (
            <p className={scss.detail__details}>Команда проекта ещё собирается.</p>
          )}
        </div>

        {hasLinks && (
          <div className={scss.detail__links}>
            {project.demo_url && (
              <Button href={project.demo_url} variant="primary" external>
                Открыть демо
              </Button>
            )}
            {project.github_url && (
              <Button href={project.github_url} variant="ghost" external>
                GitHub
              </Button>
            )}
          </div>
        )}
      </div>

      {adjacent && (
        <nav className={`container ${scss.pager}`} aria-label="Соседние проекты">
          <Link href={`/projects/${adjacent.prev.id}`} className={scss.pager__link}>
            <span className={scss.pager__direction}>
              <ArrowIcon direction="left" />
              Предыдущий
            </span>
            <span className={scss.pager__name}>{adjacent.prev.name}</span>
          </Link>

          <Link
            href={`/projects/${adjacent.next.id}`}
            className={`${scss.pager__link} ${scss["pager__link--next"]}`}
          >
            <span className={scss.pager__direction}>
              Следующий
              <ArrowIcon direction="right" />
            </span>
            <span className={scss.pager__name}>{adjacent.next.name}</span>
          </Link>
        </nav>
      )}
    </article>
  );
};

export default ProjectDetail;
```

`src/components/projects-sections/HeroImage.tsx` (full rewrite):
```tsx
"use client";

import { FC, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import ProjectCover from "@/src/ui/ProjectCover";
import scss from "./HeroImage.module.scss";

// The only client-side piece of the otherwise static detail page.
const HeroImage: FC<{ src: string | null; name: string }> = ({ src, name }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1, 1.08]);
  const y = useTransform(scrollYProgress, [0, 1], [-24, 24]);

  return (
    <div ref={ref} className={scss.frame}>
      <motion.div className={scss.image} style={{ scale, y }}>
        <ProjectCover src={src} name={name} />
      </motion.div>
    </div>
  );
};

export default HeroImage;
```

`src/components/projects-sections/HeroImage.module.scss`: replace the top-level `.image { … }` rule with the one below. Keep the reduced-motion block that sets `transform: none !important`.
```scss
.image {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  will-change: transform;
}
```

`src/components/projects-sections/TeamSection.tsx` (full rewrite, same classes and motion):
```tsx
"use client";

import { FC } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Avatar from "@/src/ui/Avatar";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import { MEMBERSHIP_ROLE_LABELS, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import type { TeamPerson } from "@/src/server/api/joins";
import scss from "./TeamSection.module.scss";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const memberVariants = {
  hidden: { opacity: 0, y: motionTokens.distance.md },
  visible: { opacity: 1, y: 0, transition: springs.gentle },
};

const TeamSection: FC<{ people: TeamPerson[] }> = ({ people }) => {
  const reduce = useReducedMotion();

  return (
    <motion.ul
      className={scss.team}
      variants={reduce ? undefined : containerVariants}
      initial={reduce ? undefined : "hidden"}
      whileInView={reduce ? undefined : "visible"}
      viewport={{ once: true, margin: "-60px" }}
    >
      {people.map(({ member, role }) => {
        const name = fullName(member);
        const caption = [MEMBERSHIP_ROLE_LABELS[role], positionLabel(member.position)]
          .filter(Boolean)
          .join(" · ");
        return (
          <motion.li
            key={member.id}
            className={scss.member}
            variants={reduce ? undefined : memberVariants}
          >
            <Link
              href={`/team/${member.id}`}
              className={scss.member__link}
              aria-label={`${name}, ${caption}`}
            >
              <span className={scss.member__avatar}>
                <Avatar src={member.avatar} name={name} imageClassName={scss.member__avatarImg} />
              </span>

              <span className={scss.member__info}>
                <span className={scss.member__role}>{name}</span>
                <span className={scss.member__stack}>{caption}</span>
              </span>
            </Link>
          </motion.li>
        );
      })}
    </motion.ul>
  );
};

export default TeamSection;
```

- [ ] **Step 3: Type check and look at it**

Run: `bunx next typegen && bunx tsc --noEmit`
Expected: exit 0.

With the dev server running:
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/projects/1
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/projects/abc
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/projects/999999
curl -s http://localhost:3000/projects/1 | grep -o 'Нурлан Асанов' | head -1
```
Expected: `200`, `404`, `404`, `Нурлан Асанов` (lead of project 1).

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/projects" src/components/projects-sections/ProjectDetail.tsx src/components/projects-sections/TeamSection.tsx src/components/projects-sections/HeroImage.tsx src/components/projects-sections/HeroImage.module.scss
git commit -m "feat: show project details and team from the api" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: `/team`

**Files:**
- Modify: `src/components/Team.tsx`, `src/components/team-sections/Roster.tsx`, `src/components/team-sections/Teams.tsx`, `src/components/team-sections/specialization-icons.tsx`
- Delete: `src/components/team-sections/Specializations.tsx`, `src/components/team-sections/Specializations.module.scss`

**Interfaces:**
- Consumes: `getPublicRoster`, `getProjectsWithMembers`, `projectTeams`, `ProjectTeam` (Task 6); `POSITIONS`, `POSITION_LABELS`, `positionLabel`, `MEMBERSHIP_ROLE_LABELS`, `fullName` (Task 1); `Avatar` (Task 10).
- Note: `Specializations.tsx` is not rendered by any page. `Team.tsx` renders Intro, Roster and Teams only. So the spec's «Специализации со счётчиком» has no live section to adapt. The dead component is deleted rather than ported; it would otherwise keep `src/data/specializations.ts` alive. Mention this in the hand-off.

- [ ] **Step 1: Page data**

`src/components/Team.tsx` (full rewrite):
```tsx
import Intro from "@/src/components/team-sections/Intro";
import Roster from "@/src/components/team-sections/Roster";
import Teams from "@/src/components/team-sections/Teams";
import { projectTeams } from "@/src/server/api/joins";
import { getPublicRoster } from "@/src/server/api/members";
import { getProjectsWithMembers } from "@/src/server/api/projects";
import scss from "./Team.module.scss";

// Same section-per-file pattern as about-sections/ and hero-sections/.
// /teams/ needs a token, so «Команды по проектам» is built from project
// memberships instead.
const Team = async () => {
  const [members, projects] = await Promise.all([getPublicRoster(), getProjectsWithMembers()]);
  const teams = projectTeams(projects, members);
  return (
    <div className={scss.page}>
      <Intro />
      <Roster members={members} />
      {teams.length > 0 && <Teams teams={teams} />}
    </div>
  );
};

export default Team;
```

- [ ] **Step 2: Icons keyed by API position**

In `src/components/team-sections/specialization-icons.tsx`:
- add `import type { Position } from "@/src/lib/api-enums";`;
- change the map type to `Record<Position, ReactNode>`;
- rename the keys `frontend` → `Frontend_Developer`, `backend` → `Backend_Developer`, `fullstack` → `Fullstack_Developer`, `design` → `"UI/UX_Designer"`, `qa` → `QA_Engineer`, `mobile` → `Mobile_Developer`;
- delete the `ai` entry;
- change the file comment to `// Icons for Roster's position filter, keyed by the API's position values.`

- [ ] **Step 3: Roster**

In `src/components/team-sections/Roster.tsx`:
- Replace the imports of `next/image`, `SPECIALIZATIONS` and `getMemberName, type Member` with:
```tsx
import Avatar from "@/src/ui/Avatar";
import { POSITIONS, type Position } from "@/src/lib/api-enums";
import { POSITION_LABELS, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import type { MemberListItem } from "@/src/server/api/schemas";
```
- `type FilterKey = "all" | Position;`
- `DIRECTION_OPTIONS`:
```tsx
const DIRECTION_OPTIONS = [
  { value: "all", label: "Все направления" },
  ...POSITIONS.map((position) => ({
    value: position,
    label: POSITION_LABELS[position],
    icon: SPECIALIZATION_ICONS[position],
  })),
];
```
- Props: `FC<{ members: MemberListItem[] }>`. Filter: `members.filter((member) => member.position === filter)`.
- Replace the body of `visible.map(...)` with:
```tsx
              {visible.map((member, index) => {
                const name = fullName(member);
                const position = positionLabel(member.position);
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={springs.gentle}
                    className={scss.cell}
                  >
                    <Link
                      href={`/team/${member.id}`}
                      className={scss.cell__link}
                      aria-label={position ? `${name}, ${position}` : name}
                    >
                      <Avatar src={member.avatar} name={name} imageClassName={scss.cell__img} />
                      <span className={scss.cell__index}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={scss.cell__scrim} aria-hidden="true" />
                      <div className={scss.cell__caption}>
                        <span className={scss.cell__role}>{name}</span>
                        {position && <span className={scss.cell__stack}>{position}</span>}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
```

- [ ] **Step 4: Project teams**

`src/components/team-sections/Teams.tsx` (full rewrite, same classes):
```tsx
import { FC } from "react";
import Link from "next/link";
import Avatar from "@/src/ui/Avatar";
import { MEMBERSHIP_ROLE_LABELS, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import type { ProjectTeam } from "@/src/server/api/joins";
import scss from "./Teams.module.scss";

const MAX_VISIBLE_AVATARS = 3;

// One coordinated hover moment instead of another spotlight-card grid:
// the overlapping avatar cluster spreads apart as the card lifts.
// Avatars cap at 3 with a "+N" overflow badge. Only the lead is named
// below — the Roster above already lists everyone.
const Teams: FC<{ teams: ProjectTeam[] }> = ({ teams }) => (
  <section className={scss.teams}>
    <div className={`container ${scss.teams__inner}`}>
      <h2 className={scss.teams__title}>Команды по проектам</h2>
      <p className={scss.teams__lead}>
        Те же участники, собранные по проектам, над которыми они работают.
      </p>

      <div className={scss.grid}>
        {teams.map(({ project, people }) => {
          const visible = people.slice(0, MAX_VISIBLE_AVATARS);
          const overflowCount = people.length - MAX_VISIBLE_AVATARS;
          // withPeople() sorts the lead first.
          const lead = people[0];

          return (
            <div key={project.id} className={scss.card}>
              <div className={scss.avatars}>
                {visible.map(({ member }) => (
                  <span key={member.id} className={scss.avatar}>
                    <Avatar src={member.avatar} name={fullName(member)} imageClassName={scss.avatar__img} />
                  </span>
                ))}
                {overflowCount > 0 && (
                  <span className={`${scss.avatar} ${scss["avatar--overflow"]}`}>
                    +{overflowCount}
                  </span>
                )}
              </div>

              <Link href={`/projects/${project.id}`} className={scss.card__link}>
                {project.name}
                <span className={scss.card__arrow} aria-hidden="true">
                  →
                </span>
              </Link>

              {lead && (
                <div className={scss.lead}>
                  <span className={scss.lead__role}>{fullName(lead.member)}</span>
                  <span className={scss.lead__stack}>
                    {[MEMBERSHIP_ROLE_LABELS[lead.role], positionLabel(lead.member.position)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default Teams;
```

- [ ] **Step 5: Remove the dead section**

```bash
git rm src/components/team-sections/Specializations.tsx src/components/team-sections/Specializations.module.scss
```

- [ ] **Step 6: Type check and look at it**

Run: `bunx next typegen && bunx tsc --noEmit`
Expected: exit 0.

With the dev server running, open http://localhost:3000/team and check:
- 12 roster cells with initials;
- the position filter narrows them;
- «Команды по проектам» shows 5 cards with leads first.

- [ ] **Step 7: Commit**

```bash
git add src/components/Team.tsx src/components/team-sections
git commit -m "feat: build the team page from the api roster" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: `/team/[id]` member profile

**Files:**
- Modify: `app/(site)/team/[id]/page.tsx`, `src/components/MemberProfile.tsx`, `src/components/member-sections/ProfileCard.tsx`, `src/components/member-sections/ProjectPath.tsx`, `src/components/member-sections/ProjectPath.module.scss`
- Delete: `src/components/member-sections/ResumeTimeline.tsx`, `src/components/member-sections/ResumeTimeline.module.scss`

**Interfaces:**
- Consumes: `getMember`, `splitSkills` (Task 6); `parseId`, `fullName`, `plural`, `positionLabel`, project labels (Task 1); `Avatar`, `ProjectCover` (Task 10).

- [ ] **Step 1: Page**

`app/(site)/team/[id]/page.tsx` (full rewrite):
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MemberProfile from "@/src/components/MemberProfile";
import { positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { parseId } from "@/src/lib/route-id";
import { getMember } from "@/src/server/api/members";

// Inactive members stay off the public site.
const load = async (rawId: string) => {
  const id = parseId(rawId);
  const member = id === null ? null : await getMember(id);
  return member?.status === "Active" ? member : null;
};

export async function generateMetadata({
  params,
}: PageProps<"/team/[id]">): Promise<Metadata> {
  const member = await load((await params).id);
  if (!member) return {};
  return {
    title: `${fullName(member)} — Motion Community`,
    description: [positionLabel(member.position), member.bio].filter(Boolean).join(". "),
  };
}

const Page = async ({ params }: PageProps<"/team/[id]">) => {
  const member = await load((await params).id);
  if (!member) notFound();
  return <MemberProfile member={member} />;
};

export default Page;
```

- [ ] **Step 2: Profile**

`src/components/MemberProfile.tsx` (full rewrite, same classes):
```tsx
import { FC } from "react";
import Link from "next/link";
import ArrowIcon from "@/src/ui/ArrowIcon";
import ProfileCard from "@/src/components/member-sections/ProfileCard";
import ProjectPath from "@/src/components/member-sections/ProjectPath";
import { splitSkills } from "@/src/server/api/joins";
import type { MemberDetail } from "@/src/server/api/schemas";
import scss from "./MemberProfile.module.scss";

// Scenario 4 in the platform plan: a client checks someone's profile and
// projects before sending a request. The public API has no résumé
// (docs/backend-issues.md), so experience and education aren't shown.
const MemberProfile: FC<{ member: MemberDetail }> = ({ member }) => {
  const skills = splitSkills(member.skills);

  return (
    <article className={`container ${scss.profile}`}>
      <div className={scss.inner}>
        <Link href="/team" className={scss.back}>
          <ArrowIcon direction="left" />
          Все участники
        </Link>

        <div className={scss.layout}>
          <ProfileCard member={member} />

          <div className={scss.content}>
            <section className={scss.section}>
              <h2 className={scss.section__label}>О себе</h2>
              <p className={scss.bio}>
                {member.bio || "Участник пока ничего не рассказал о себе."}
              </p>
            </section>

            {skills.length > 0 && (
              <section className={scss.section}>
                <h2 className={scss.section__label}>Навыки</h2>
                <ul className={scss.skills}>
                  {skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className={scss.section}>
              <h2 className={scss.section__label}>Путь в проектах</h2>
              <ProjectPath projects={member.projects} />
            </section>
          </div>
        </div>
      </div>
    </article>
  );
};

export default MemberProfile;
```

`src/components/member-sections/ProfileCard.tsx` (full rewrite, same classes):
```tsx
import { FC } from "react";
import Button from "@/src/ui/Button";
import Avatar from "@/src/ui/Avatar";
import { positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { plural } from "@/src/lib/plural";
import type { MemberDetail } from "@/src/server/api/schemas";
import scss from "./ProfileCard.module.scss";

interface ProfileLink {
  href: string;
  label: string;
}

// Sticky header on desktop — keeps «Обсудить проект» in reach while the
// client reads the rest of the profile.
const ProfileCard: FC<{ member: MemberDetail }> = ({ member }) => {
  const name = fullName(member);
  const position = positionLabel(member.position);
  const projectCount = member.projects.length;

  // Only links the member actually filled in — no dead buttons.
  const links = [
    member.github && { href: member.github, label: "GitHub" },
    member.linkedin && { href: member.linkedin, label: "LinkedIn" },
    member.portfolio && { href: member.portfolio, label: "Портфолио" },
    member.resume && { href: member.resume, label: "Резюме (PDF)" },
  ].filter((link): link is ProfileLink => Boolean(link));

  return (
    <aside className={scss.card}>
      {/* Same portrait + bottom scrim + caption language as the Roster
          cells on /team, at profile scale. */}
      <div className={scss.photo}>
        <Avatar src={member.avatar} name={name} imageClassName={scss.photo__img} eager />
        <span className={scss.photo__scrim} aria-hidden="true" />
        <div className={scss.caption}>
          <h1 className={scss.name}>{name}</h1>
          {position && <p className={scss.role}>{position}</p>}
        </div>
      </div>

      <div className={scss.body}>
        {projectCount > 0 && (
          <dl className={scss.facts}>
            <div>
              <dt>{plural(projectCount, "проект", "проекта", "проектов")}</dt>
              <dd>{projectCount}</dd>
            </div>
          </dl>
        )}

        {links.length > 0 && (
          <ul className={scss.links}>
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <Button href="/contact" variant="primary" className={scss.cta}>
          Обсудить проект
        </Button>
      </div>
    </aside>
  );
};

export default ProfileCard;
```

`src/components/member-sections/ProjectPath.tsx`:
- Replace the imports of `STATUS_LABELS, STATUS_TONE` and `MemberProject, ProjectRole` with:
```tsx
import ProjectCover from "@/src/ui/ProjectCover";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import type { ProjectListItem } from "@/src/server/api/schemas";
```
- Delete `ROLE_LABELS`. Keep the variants.
- Replace the component with:
```tsx
// Same rail-and-nodes motif as the /login path panel, here as this
// member's track record. The API doesn't say which role they had in each
// project, so there's no role badge.
const ProjectPath: FC<{ projects: ProjectListItem[] }> = ({ projects }) => {
  const reduce = useReducedMotion();

  if (projects.length === 0) {
    return (
      <p className={scss.empty}>
        Участник пока не входил в команды проектов сообщества.
      </p>
    );
  }

  return (
    <motion.ol
      className={scss.path}
      variants={listVariants}
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      <motion.span className={scss.path__rail} aria-hidden="true" variants={railVariants} />
      {projects.map((project) => {
        const tone = PROJECT_STATUS_TONE[project.project_status];
        return (
          <motion.li key={project.id} className={scss.step} variants={itemVariants}>
            <span className={`${scss.step__node} ${scss[`tone--${tone}`]}`} aria-hidden="true" />
            <Link href={`/projects/${project.id}`} className={scss.step__link}>
              <div className={scss.step__body}>
                <div className={scss.step__meta}>
                  <span className={scss[`tone--${tone}`]}>
                    {PROJECT_STATUS_LABELS[project.project_status]}
                  </span>
                  <span className={scss.step__role}>{project.category}</span>
                </div>
                <h3 className={scss.step__name}>{project.name}</h3>
              </div>
              <span className={scss.step__thumb}>
                <ProjectCover src={project.preview_image} name={project.name} />
              </span>
            </Link>
          </motion.li>
        );
      })}
    </motion.ol>
  );
};
```

`src/components/member-sections/ProjectPath.module.scss`: replace the `.step__image { … }` rule with:
```scss
.step__thumb {
  position: relative;
  display: none;
  flex: none;
  width: 144px;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 10px;
  background: var(--color-surface-2);

  @media (min-width: 640px) {
    display: block;
  }
}
```

- [ ] **Step 3: Remove the résumé timeline**

```bash
git rm src/components/member-sections/ResumeTimeline.tsx src/components/member-sections/ResumeTimeline.module.scss
```

- [ ] **Step 4: Type check and look at it**

Run: `bunx next typegen && bunx tsc --noEmit`
Expected: exit 0.

With the dev server running:
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/team/2
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/team/9999
curl -s http://localhost:3000/team/2 | grep -o 'Motion Marketplace' | head -1
```
Expected: `200`, `404`, `Motion Marketplace` (one of member 2's projects).

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/team/[id]/page.tsx" src/components/MemberProfile.tsx src/components/member-sections
git commit -m "feat: show member profiles from the api" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: `/about` services without project lists

**Files:**
- Modify: `src/data/services.ts`, `src/components/About.tsx`, `src/components/about-sections/Services.tsx`

**Interfaces:**
- Produces: `ServiceCategory` and `PROJECT_TYPES` in `src/data/services.ts`. `PROJECT_TYPES` lists the service titles plus «Другое» and is used by `/contact` (Task 16).

- [ ] **Step 1: Services data stands alone**

In `src/data/services.ts`:
- replace `import type { ProjectCategory } from "./projects";` with:
```ts
export type ServiceCategory = "web" | "systems" | "bots" | "ai";
```
- change the field to `category: ServiceCategory;`;
- replace the comment above `SERVICES` with:
```ts
// Single source for the homepage teaser (ServicesPreview), the detailed
// About section and the request form's project types. `category` is the
// service's own id (CSS hooks, tab ids): API project categories are free
// text and don't map onto services.
```
- append at the end of the file:
```ts
// Request form choices: the API takes any string ≤150 as project_type.
export const PROJECT_TYPES = SERVICES.map((service) => service.title).concat(
  "Другое",
) as [string, ...string[]];
```

- [ ] **Step 2: About no longer fetches projects**

`src/components/About.tsx`:
- remove the `getPublicProjects` import;
- make the component synchronous: `const About = () => {`;
- delete the `projects` line;
- render `<Services />`.

`src/components/about-sections/Services.tsx` (full rewrite, same classes and motion):
```tsx
"use client";

import { FC, KeyboardEvent, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens, springs } from "@/src/lib/motion-tokens";
import Button from "@/src/ui/Button";
import { SERVICES } from "@/src/data/services";
import scss from "./Services.module.scss";

// Homepage ServicesPreview is the teaser; this is the detail a client
// reads on /about: scope and team per service.
const Services: FC = () => {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = SERVICES[active];

  // WAI-ARIA tabs: arrows move between tabs, Home/End jump to the ends.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = SERVICES.length - 1;
    const next =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? (active + 1) % SERVICES.length
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? (active - 1 + SERVICES.length) % SERVICES.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className={scss.services} id="services">
      <div className="container">
        <span className={scss.services__eyebrow}>
          <span className={scss.services__index}>§ 06</span>
          Услуги
        </span>
        <h2 className={scss.services__title}>Как мы работаем с вашим проектом</h2>

        <div className={scss.layout}>
          <div
            className={scss.tabs}
            role="tablist"
            aria-label="Услуги"
            aria-orientation="vertical"
            onKeyDown={handleKeyDown}
          >
            {SERVICES.map((item, index) => {
              const selected = index === active;
              return (
                <button
                  key={item.category}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`service-tab-${item.category}`}
                  aria-selected={selected}
                  aria-controls="service-panel"
                  tabIndex={selected ? 0 : -1}
                  className={`${scss.tab} ${selected ? scss["tab--active"] : ""}`}
                  onClick={() => setActive(index)}
                >
                  {selected && (
                    <motion.span
                      layoutId="service-tab-highlight"
                      className={scss.tab__highlight}
                      transition={reduce ? { duration: 0 } : springs.snappy}
                    />
                  )}
                  <span className={scss.tab__label}>{item.title}</span>
                </button>
              );
            })}
          </div>

          <div
            className={scss.panel}
            role="tabpanel"
            id="service-panel"
            aria-labelledby={`service-tab-${current.category}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.category}
                initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.sm }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: motionTokens.duration.instant } }}
                transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easing.smooth }}
              >
                <p className={scss.panel__description}>{current.description}</p>

                <div className={scss.columns}>
                  <div>
                    <h3 className={scss.panel__label}>Что входит</h3>
                    <ul className={scss.includes}>
                      {current.includes.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className={scss.panel__label}>Кто в команде</h3>
                    <ul className={scss.team}>
                      {current.team.map((role) => (
                        <li key={role}>{role}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Button href="/contact" variant="ghost" className={scss.panel__cta}>
                  Обсудить такой проект
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
```

- [ ] **Step 3: Type check and look at it**

Run: `bunx next typegen && bunx tsc --noEmit`
Expected: exit 0. Open http://localhost:3000/about#services: the tabs switch, there are no counters and no «Уже сделали» block.

- [ ] **Step 4: Commit**

```bash
git add src/data/services.ts src/components/About.tsx src/components/about-sections/Services.tsx
git commit -m "refactor: decouple about services from project categories" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: `/contact` sends to the API

**Files:**
- Rewrite: `src/server/validation/client-request.ts`, `src/server/validation/client-request.test.ts`, `src/actions/client-requests.ts`
- Modify: `src/components/contact-sections/RequestForm.tsx`
- Test: `src/actions/client-requests.test.ts`

**Interfaces:**
- Consumes: `createClientRequest`, `ClientRequestWrite` (Task 6); `isApiError`, `apiErrorMessage` (Task 2); `PROJECT_TYPES` (Task 15).
- Produces: `parseClientRequest(formData)` returning the API's field names; `submitClientRequest` with the same name and `RequestFormState` shape as today.

- [ ] **Step 1: Write the failing tests**

`src/server/validation/client-request.test.ts` (full rewrite):
```ts
import { describe, expect, it } from "vitest";
import { parseClientRequest } from "./client-request";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

const valid = {
  name: "Айбек",
  company: "Склад-Сервис",
  email: "aibek@company.kg",
  phone: "+996 555 123 456",
  title: "CRM для склада",
  description: "Нужна система учёта остатков на складе.",
  project_type: "Веб-системы",
  budget: "",
};

describe("parseClientRequest", () => {
  it("accepts a valid request and turns a blank budget into null", () => {
    const result = parseClientRequest(form(valid));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.budget).toBeNull();
  });

  it("reads the budget as a number of som", () => {
    const result = parseClientRequest(form({ ...valid, budget: "300 000" }));
    expect(result.success && result.data.budget).toBe(300000);
  });

  it("requires company and phone like the API", () => {
    const result = parseClientRequest(form({ ...valid, company: "", phone: " " }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.company).toBeDefined();
      expect(result.fieldErrors.phone).toBeDefined();
    }
  });

  it("flags a bad email, a short description and a non-numeric budget", () => {
    const result = parseClientRequest(
      form({ ...valid, email: "nope", description: "кратко", budget: "дорого" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["budget", "description", "email"]);
    }
  });

  it("only accepts the offered project types", () => {
    expect(parseClientRequest(form({ ...valid, project_type: "rockets" })).success).toBe(false);
    expect(parseClientRequest(form({ ...valid, project_type: "Другое" })).success).toBe(true);
  });
});
```

`src/actions/client-requests.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { updateTag } from "next/cache";
import { createClientRequest } from "@/src/server/api/client-requests";
import { ApiError } from "@/src/server/api/errors";
import { submitClientRequest } from "./client-requests";

vi.mock("next/cache", () => ({ updateTag: vi.fn() }));
vi.mock("@/src/server/api/client-requests", () => ({ createClientRequest: vi.fn() }));

const valid = {
  name: "Айбек",
  company: "Склад-Сервис",
  email: "aibek@company.kg",
  phone: "+996 555 123 456",
  title: "CRM для склада",
  description: "Нужна система учёта остатков на складе.",
  project_type: "Веб-системы",
};

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("submitClientRequest", () => {
  it("sends API field names and refreshes the stats", async () => {
    vi.mocked(createClientRequest).mockResolvedValue(undefined);
    await expect(submitClientRequest({}, form({ ...valid, budget: "150000" }))).resolves.toEqual({ ok: true });
    expect(createClientRequest).toHaveBeenCalledWith({ ...valid, budget: 150000 });
    expect(updateTag).toHaveBeenCalledWith("stats");
  });

  it("puts DRF field errors back onto the form", async () => {
    vi.mocked(createClientRequest).mockRejectedValue(
      new ApiError("validation", 400, "", { phone: "Неверный номер." }),
    );
    const state = await submitClientRequest({}, form({ ...valid, budget: "" }));
    expect(state.fieldErrors).toEqual({ phone: "Неверный номер." });
    expect(state.values?.name).toBe("Айбек");
  });

  it("keeps the brief when the API is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(createClientRequest).mockRejectedValue(new ApiError("unavailable", 0, "x"));
    const state = await submitClientRequest({}, form({ ...valid, budget: "" }));
    expect(state.error).toMatch(/Не удалось отправить заявку/);
    expect(state.values?.title).toBe("CRM для склада");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun run test src/server/validation/client-request.test.ts src/actions/client-requests.test.ts`
Expected: FAIL — old field names (`projectType`, optional company).

- [ ] **Step 3: Implement**

`src/server/validation/client-request.ts` (full rewrite):
```ts
import { z } from "zod";
import { PROJECT_TYPES } from "@/src/data/services";
import { parseForm, requiredText } from "./form";

// "300 000" → 300000, blank → null: budget is optional and in som.
const budget = z.preprocess(
  (value) => (typeof value === "string" ? value.replace(/\s/g, "") : ""),
  z
    .string()
    .regex(/^\d{0,12}$/, "Укажите сумму цифрами, в сомах")
    .transform((value) => (value === "" ? null : Number(value))),
);

// Field names and limits from the API's ClientRequestCreate.
export const clientRequestSchema = z.object({
  name: requiredText(2, 150, "Имя"),
  company: requiredText(1, 150, "Компания"),
  email: z.email("Проверьте email: например, name@company.kg").max(254, "Не больше 254 символов"),
  phone: requiredText(1, 128, "Телефон"),
  title: requiredText(2, 150, "Название проекта"),
  description: requiredText(10, 2000, "Описание проекта"),
  project_type: z.enum(PROJECT_TYPES, "Выберите тип из списка"),
  budget,
});

export type ClientRequestFields = z.infer<typeof clientRequestSchema>;

export const parseClientRequest = (formData: FormData) =>
  parseForm(clientRequestSchema, formData);
```

`src/actions/client-requests.ts` (full rewrite):
```ts
"use server";

import { updateTag } from "next/cache";
import { createClientRequest } from "@/src/server/api/client-requests";
import { apiErrorMessage, isApiError } from "@/src/server/api/errors";
import { parseClientRequest } from "@/src/server/validation/client-request";
import type { FieldErrors } from "@/src/server/validation/form";

export interface RequestFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
  // Echoed back: React resets the form after an action, and a client who
  // mistyped their email shouldn't have to retype the whole brief.
  values?: Record<string, string>;
}

const echo = (formData: FormData): Record<string, string> =>
  Object.fromEntries(
    [...formData.entries()].filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && !entry[0].startsWith("$"),
    ),
  );

// Public: clients have no account (ТЗ §3), so no session check here.
export async function submitClientRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const parsed = parseClientRequest(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.fieldErrors, values: echo(formData) };
  }

  try {
    await createClientRequest(parsed.data);
  } catch (error) {
    if (isApiError(error, "validation")) {
      const hasFields = Object.keys(error.fieldErrors).length > 0;
      return {
        fieldErrors: error.fieldErrors,
        error: hasFields ? error.message || undefined : apiErrorMessage(error),
        values: echo(formData),
      };
    }
    console.error("Failed to submit client request", error);
    return {
      error: "Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram.",
      values: echo(formData),
    };
  }

  // companies_count on /stats/ may have changed.
  updateTag("stats");
  return { ok: true };
}
```

`src/components/contact-sections/RequestForm.tsx`:
- Replace `import { CATEGORY_LABELS } from "@/src/data/projects";` with `import { PROJECT_TYPES } from "@/src/data/services";`.
- Make «Компания» and «Телефон» required: add `required` to both `<Field>`s and their inputs.
- Replace the whole project-type field and the budget field with:
```tsx
          <Field
            name="project_type"
            label="Тип проекта"
            required
            error={errors.project_type}
          >
            {(describedBy) => (
              <select {...inputProps("project_type", describedBy)} required>
                <option value="">Выберите тип</option>
                {PROJECT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field
            name="budget"
            label="Бюджет, сом (опционально)"
            error={errors.budget}
          >
            {(describedBy) => (
              <input
                {...inputProps("budget", describedBy)}
                type="text"
                inputMode="numeric"
                placeholder="Например, 300 000"
              />
            )}
          </Field>
```

- [ ] **Step 4: Run tests and the type check**

Run: `bun run test && bunx tsc --noEmit`
Expected: PASS, exit 0.

With the dev server running, open http://localhost:3000/contact and submit the empty form. Expected: errors under Имя, Компания, Email, Телефон, Название, Тип проекта, Описание, and no request reaches the API. Do **not** submit a filled form without the user's permission: it lands in the backend's real database.

- [ ] **Step 5: Commit**

```bash
git add src/server/validation/client-request.ts src/server/validation/client-request.test.ts src/actions/client-requests.ts src/actions/client-requests.test.ts src/components/contact-sections/RequestForm.tsx
git commit -m "feat: send client requests to the api" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Admin — requests, error mapping, refresh helper

**Files:**
- Create: `src/actions/admin/refresh.ts`
- Rewrite:
  - `src/actions/admin/handle-error.ts`, `src/actions/admin/requests.ts`
  - `src/server/validation/request-status.ts`, `src/server/validation/request-status.test.ts`
  - `src/components/admin/requests/RequestBoard.tsx`, `src/components/admin/requests/StatusForm.tsx`
  - `app/(admin)/admin/requests/page.tsx`, `app/(admin)/admin/requests/[id]/page.tsx`
- Modify: `src/components/admin/requests/RequestBoard.module.scss`
- Test: `src/actions/admin/handle-error.test.ts`

**Interfaces:**
- Consumes: `getClientRequests`, `getClientRequest`, `setClientRequestStatus`, `PUBLIC_TAGS` (Tasks 5–6); request labels (Task 1); `parseId` (Task 1).
- Produces:
  - `refreshAfterAdminChange(): void`;
  - `toFormError(error, values): FormState`;
  - `toActionError(error): ActionResult`.
  - Both error mappers call `unstable_rethrow` first. The old member, team and project actions keep compiling: their repository errors now fall into the generic «Не удалось сохранить» branch until Tasks 19–20 replace them.

- [ ] **Step 1: Write the failing tests**

`src/actions/admin/handle-error.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/server/api/errors";
import { toActionError, toFormError } from "./handle-error";

describe("admin error mapping", () => {
  it("maps DRF field errors onto the form and keeps the values", () => {
    const state = toFormError(
      new ApiError("validation", 400, "", { team_name: "Такая команда уже есть." }),
      { team_name: "A" },
    );
    expect(state).toEqual({
      fieldErrors: { team_name: "Такая команда уже есть." },
      values: { team_name: "A" },
    });
  });

  it("explains API failures in Russian", () => {
    expect(toFormError(new ApiError("forbidden", 403, "x"), {}).error).toBe(
      "Недостаточно прав для этого действия.",
    );
    expect(toActionError(new ApiError("unavailable", 0, "x")).error).toMatch(/Сервер недоступен/);
  });

  it("logs anything unexpected", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(toFormError(new Error("boom"), {}).error).toBe("Не удалось сохранить. Попробуйте ещё раз.");
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("lets Next's redirects through", () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;push;/login;307;",
    });
    expect(() => toActionError(redirect)).toThrow("NEXT_REDIRECT");
  });
});
```

`src/server/validation/request-status.test.ts` (full rewrite):
```ts
import { describe, expect, it } from "vitest";
import { parseRequestStatus } from "./request-status";

const form = (status: string) => {
  const data = new FormData();
  data.set("status", status);
  return data;
};

describe("parseRequestStatus", () => {
  it("accepts the two API statuses", () => {
    expect(parseRequestStatus(form("New")).success).toBe(true);
    expect(parseRequestStatus(form("Reviewing")).success).toBe(true);
  });

  it("rejects anything else, including the old pipeline statuses", () => {
    expect(parseRequestStatus(form("ACCEPTED")).success).toBe(false);
    expect(parseRequestStatus(form("")).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun run test src/actions/admin/handle-error.test.ts src/server/validation/request-status.test.ts`
Expected: FAIL — `toActionError` missing; the old enum accepts `ACCEPTED`.

- [ ] **Step 3: Implement**

`src/actions/admin/refresh.ts`:
```ts
import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_TAGS } from "@/src/server/api/client";

// Admin views render per request; the public site reads the tagged cache.
// Updating all three tags is cheap and never misses a dependent page.
export function refreshAfterAdminChange(): void {
  for (const tag of PUBLIC_TAGS) updateTag(tag);
  revalidatePath("/admin", "layout");
}
```

`src/actions/admin/handle-error.ts` (full rewrite):
```ts
import "server-only";
import { unstable_rethrow } from "next/navigation";
import { apiErrorMessage, isApiError } from "@/src/server/api/errors";
import { SAVE_FAILED, type ActionResult, type FormState } from "./form-state";

// Maps API errors to what the admin sees. Next's own control-flow errors
// (the redirect on an expired session) pass straight through.
export function toFormError(error: unknown, values: Record<string, string>): FormState {
  unstable_rethrow(error);
  if (isApiError(error, "validation")) {
    const hasFields = Object.keys(error.fieldErrors).length > 0;
    return {
      fieldErrors: error.fieldErrors,
      error: hasFields ? error.message || undefined : apiErrorMessage(error),
      values,
    };
  }
  if (isApiError(error)) return { error: apiErrorMessage(error), values };
  console.error("Admin mutation failed", error);
  return { error: SAVE_FAILED, values };
}

export function toActionError(error: unknown): ActionResult {
  unstable_rethrow(error);
  if (isApiError(error)) return { error: apiErrorMessage(error) };
  console.error("Admin action failed", error);
  return { error: SAVE_FAILED };
}
```

`src/server/validation/request-status.ts` (full rewrite):
```ts
import { z } from "zod";
import { REQUEST_STATUSES } from "@/src/lib/api-enums";
import { parseForm } from "./form";

const requestStatusSchema = z.object({
  status: z.enum(REQUEST_STATUSES, "Выберите статус из списка"),
});

export const parseRequestStatus = (formData: FormData) =>
  parseForm(requestStatusSchema, formData);
```

`src/actions/admin/requests.ts` (full rewrite):
```ts
"use server";

import { setClientRequestStatus } from "@/src/server/api/client-requests";
import { requireAdmin } from "@/src/server/auth/dal";
import { parseRequestStatus } from "@/src/server/validation/request-status";
import type { FormState } from "./form-state";
import { toFormError } from "./handle-error";
import { refreshAfterAdminChange } from "./refresh";

export async function setRequestStatusAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseRequestStatus(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await setClientRequestStatus(id, parsed.data.status);
  } catch (error) {
    return toFormError(error, {});
  }
  refreshAfterAdminChange();
  return { ok: true };
}
```

`src/components/admin/requests/RequestBoard.tsx` (full rewrite):
```tsx
import { FC } from "react";
import Link from "next/link";
import { REQUEST_STATUSES, type RequestStatus } from "@/src/lib/api-enums";
import type { ClientRequestListItem } from "@/src/server/api/schemas";
import { formatDate } from "../labels";
import scss from "./RequestBoard.module.scss";

const COLUMN_TITLES: Record<RequestStatus, string> = {
  New: "Новые",
  Reviewing: "На рассмотрении",
};

const RequestCard: FC<{ request: ClientRequestListItem }> = ({ request }) => (
  <li>
    <Link href={`/admin/requests/${request.id}`} className={scss.card}>
      <span className={scss.card__title}>{request.title}</span>
      <span className={scss.card__client}>{request.name}</span>
      <span className={scss.card__meta}>
        <span>{formatDate(request.created_at)}</span>
      </span>
    </Link>
  </li>
);

// Board, not a table: the API knows two stages (New → Reviewing). Status
// changes on the detail page. Stacks into sections on small screens.
const RequestBoard: FC<{ requests: ClientRequestListItem[] }> = ({ requests }) => {
  const byStatus = (status: RequestStatus) =>
    requests.filter((request) => request.status === status);

  return (
    <>
      <nav className={scss.jump} aria-label="Перейти к статусу">
        {REQUEST_STATUSES.map((status) => (
          <a key={status} href={`#status-${status}`}>
            {COLUMN_TITLES[status]} <b>{byStatus(status).length}</b>
          </a>
        ))}
      </nav>

      <div className={scss.board}>
        {REQUEST_STATUSES.map((status) => {
          const items = byStatus(status);
          return (
            <section
              key={status}
              id={`status-${status}`}
              className={`${scss.column} ${scss[`column--${status}`] ?? ""}`}
              aria-labelledby={`col-${status}`}
            >
              <h2 id={`col-${status}`} className={scss.column__title}>
                {COLUMN_TITLES[status]}
                <span className={scss.column__count}>{items.length}</span>
              </h2>
              {items.length === 0 ? (
                <p className={scss.column__empty}>Пусто</p>
              ) : (
                <ul className={scss.column__list}>
                  {items.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
};

export default RequestBoard;
```

`src/components/admin/requests/RequestBoard.module.scss`:
- in `.board`, change `repeat(5, minmax(0, 1fr))` to `repeat(2, minmax(0, 1fr))`;
- rename `.column--NEW` to `.column--New`;
- delete the `.column--ACCEPTED, .column--COMPLETED` rule, the `.column--IN_PROGRESS` rule and every `.rejected` / `.rejected__list` rule (including the one inside a media query).

`src/components/admin/requests/StatusForm.tsx` (full rewrite):
```tsx
"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import type { FormState } from "@/src/actions/admin/form-state";
import { REQUEST_STATUSES, type RequestStatus } from "@/src/lib/api-enums";
import { REQUEST_STATUS_LABELS } from "@/src/lib/api-labels";

interface StatusFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  status: RequestStatus;
}

const OPTIONS = REQUEST_STATUSES.map((value) => ({ value, label: REQUEST_STATUS_LABELS[value] }));

const StatusForm: FC<StatusFormProps> = ({ action, status }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const error = pending ? undefined : state.fieldErrors?.status;

  return (
    <form action={formAction}>
      <Field label="Статус заявки" htmlFor="request-status" error={error}>
        <Select
          id="request-status"
          name="status"
          defaultValue={status}
          invalid={Boolean(error)}
          describedBy={error ? "request-status-error" : undefined}
          block
          options={OPTIONS}
        />
      </Field>
      <FormActions submitLabel="Сохранить статус" pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default StatusForm;
```

`app/(admin)/admin/requests/page.tsx` (full rewrite):
```tsx
import PageHeader from "@/src/components/admin/ui/PageHeader";
import RequestBoard from "@/src/components/admin/requests/RequestBoard";
import { getClientRequests } from "@/src/server/api/client-requests";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  const requests = await getClientRequests();
  return (
    <>
      <PageHeader title="Заявки" description="Заявки клиентов с формы на странице «Контакты»." />
      <RequestBoard requests={requests} />
    </>
  );
};

export default Page;
```

`app/(admin)/admin/requests/[id]/page.tsx` (full rewrite):
```tsx
import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import StatusForm from "@/src/components/admin/requests/StatusForm";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import { formatDate } from "@/src/components/admin/labels";
import { setRequestStatusAction } from "@/src/actions/admin/requests";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_TONE } from "@/src/lib/api-labels";
import { parseId } from "@/src/lib/route-id";
import { getClientRequest } from "@/src/server/api/client-requests";
import { requireAdmin } from "@/src/server/auth/dal";

const formatBudget = (budget: number | null) =>
  budget === null ? "Не указан" : `${budget.toLocaleString("ru-RU")} сом`;

const Page = async ({ params }: PageProps<"/admin/requests/[id]">) => {
  await requireAdmin();
  const id = parseId((await params).id);
  const request = id === null ? null : await getClientRequest(id);
  if (!request) notFound();

  const contact = [
    { label: "Имя", value: request.name },
    { label: "Компания", value: request.company },
    { label: "Email", value: <a href={`mailto:${request.email}`}>{request.email}</a> },
    { label: "Телефон", value: request.phone && <a href={`tel:${request.phone}`}>{request.phone}</a> },
  ];

  return (
    <>
      <PageHeader
        title={request.title}
        description={`Заявка от ${formatDate(request.created_at)}`}
        back={{ href: "/admin/requests", label: "Заявки" }}
        meta={
          <StatusBadge tone={REQUEST_STATUS_TONE[request.status]}>
            {REQUEST_STATUS_LABELS[request.status]}
          </StatusBadge>
        }
      />
      <div className={scss.split}>
        <Panel title="Описание">
          <dl className={scss.meta}>
            <div>
              <dt>Тип проекта</dt>
              <dd>{request.project_type || "Не указан"}</dd>
            </div>
            <div>
              <dt>Бюджет</dt>
              <dd>{formatBudget(request.budget)}</dd>
            </div>
            <div>
              <dt>Что нужно сделать</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{request.description}</dd>
            </div>
          </dl>
        </Panel>
        <div>
          <Panel title="Статус">
            <StatusForm action={setRequestStatusAction.bind(null, request.id)} status={request.status} />
          </Panel>
          <Panel title="Клиент">
            <dl className={scss.meta}>
              {contact.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value || "—"}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
};

export default Page;
```

- [ ] **Step 4: Run all tests and the type check**

Run: `bun run test && bunx next typegen && bunx tsc --noEmit`
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/actions/admin/refresh.ts src/actions/admin/handle-error.ts src/actions/admin/handle-error.test.ts src/actions/admin/requests.ts src/server/validation/request-status.ts src/server/validation/request-status.test.ts src/components/admin/requests "app/(admin)/admin/requests"
git commit -m "feat: manage client requests through the api" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Admin — shell, nav counts and overview

**Files:**
- Rewrite: `src/components/admin/AvatarStack.tsx`, `src/components/admin/overview/RequestFunnel.tsx`, `app/(admin)/admin/page.tsx`, `app/(admin)/admin/layout.tsx`
- Modify:
  - `src/components/admin/AdminNav.tsx`, `src/components/admin/icons.tsx`
  - `src/components/admin/overview/Overview.module.scss`
  - `src/components/admin/projects/ProjectCard.tsx` (two prop names, until Task 19)
- Delete: `app/(admin)/admin/settings/page.tsx`

**Interfaces:**
- Consumes:
  - Task 6: `getMembers(true)`, `getProjects(true)`, `getProjectsWithMembers(true)`, `getTeams`, `getClientRequests`, `withPeople`, `projectsWithoutLead`, `idleMembers`.
  - Task 1: `plural`, `fullName`.
  - Task 10: `Avatar`.
- Produces: `AvatarStack` props `{ people: { name: string; avatar: string | null }[] }`. No ids needed: it's a static display list.

- [ ] **Step 1: AvatarStack with fallbacks**

`src/components/admin/AvatarStack.tsx` (full rewrite):
```tsx
import { FC } from "react";
import Avatar from "@/src/ui/Avatar";
import scss from "./AvatarStack.module.scss";

export interface AvatarPerson {
  name: string;
  avatar: string | null;
}

const MAX = 4;

const AvatarStack: FC<{ people: AvatarPerson[] }> = ({ people }) => {
  if (people.length === 0) return <span className={scss.none}>Нет участников</span>;
  const visible = people.slice(0, MAX);
  const extra = people.length - visible.length;
  return (
    <span className={scss.stack} aria-label={people.map((person) => person.name).join(", ")}>
      {visible.map((person, index) => (
        <span key={index} className={scss.avatar} title={person.name}>
          <Avatar src={person.avatar} name={person.name} imageClassName={scss.avatar__img} />
        </span>
      ))}
      {extra > 0 && <span className={`${scss.avatar} ${scss.more}`}>+{extra}</span>}
    </span>
  );
};

export default AvatarStack;
```

In the old `src/components/admin/projects/ProjectCard.tsx`, adapt the call until Task 19 rewrites the card:
```tsx
          <AvatarStack
            people={members.map((member) => ({
              name: `${member.profile.firstName} ${member.profile.lastName}`,
              avatar: member.profile.photo,
            }))}
          />
```

- [ ] **Step 2: Funnel with the API's two stages**

`src/components/admin/overview/RequestFunnel.tsx` (full rewrite):
```tsx
"use client";

import { FC } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "@/src/lib/motion-tokens";
import { REQUEST_STATUSES, type RequestStatus } from "@/src/lib/api-enums";
import scss from "./Overview.module.scss";

// Plural forms: the funnel counts groups of requests.
const STAGE_LABELS: Record<RequestStatus, string> = {
  New: "Новые",
  Reviewing: "На рассмотрении",
};

const STEP_DELAY = motionTokens.duration.slow / REQUEST_STATUSES.length;

// The overview's one motion moment: the rail draws left to right and
// each stage lights up — same rail-and-node language as /login and the
// member profile's project path.
const RequestFunnel: FC<{ counts: Record<RequestStatus, number> }> = ({ counts }) => {
  const reduce = useReducedMotion();

  return (
    <div className={scss.funnel}>
      <ol className={scss.funnel__flow}>
        <motion.span
          className={scss.funnel__rail}
          aria-hidden="true"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth }}
        />
        {REQUEST_STATUSES.map((status, index) => (
          <motion.li
            key={status}
            className={`${scss.stage} ${counts[status] > 0 ? scss["stage--filled"] : ""}`}
            initial={reduce ? false : { opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ duration: motionTokens.duration.normal, delay: index * STEP_DELAY }}
          >
            <Link href={`/admin/requests#status-${status}`} className={scss.stage__link}>
              <span className={scss.stage__node} aria-hidden="true" />
              <span className={scss.stage__count}>{counts[status]}</span>
              <span className={scss.stage__label}>{STAGE_LABELS[status]}</span>
            </Link>
          </motion.li>
        ))}
      </ol>
    </div>
  );
};

export default RequestFunnel;
```

`src/components/admin/overview/Overview.module.scss`:
- in `.funnel__flow`, change `repeat(5, minmax(0, 1fr))` to `repeat(2, minmax(0, 1fr))`;
- delete the `.funnel__rejected` rule.

- [ ] **Step 3: Overview page**

`app/(admin)/admin/page.tsx` (full rewrite; the JSX keeps today's structure and classes):
```tsx
import Link from "next/link";
import AvatarStack from "@/src/components/admin/AvatarStack";
import RequestFunnel from "@/src/components/admin/overview/RequestFunnel";
import { ArrowRightIcon } from "@/src/components/admin/icons";
import scss from "@/src/components/admin/overview/Overview.module.scss";
import type { RequestStatus } from "@/src/lib/api-enums";
import { fullName } from "@/src/lib/people";
import { plural } from "@/src/lib/plural";
import { getClientRequests } from "@/src/server/api/client-requests";
import { idleMembers, projectsWithoutLead, withPeople } from "@/src/server/api/joins";
import { getMembers } from "@/src/server/api/members";
import { getProjectsWithMembers } from "@/src/server/api/projects";
import { requireAdmin } from "@/src/server/auth/dal";

interface AttentionItem {
  href: string;
  text: string;
  tone: "accent" | "warn" | "muted";
}

const Page = async () => {
  await requireAdmin();
  const [requests, projects, roster] = await Promise.all([
    getClientRequests(),
    getProjectsWithMembers(true),
    getMembers(true),
  ]);

  const counts = requests.reduce<Record<RequestStatus, number>>(
    (acc, request) => ({ ...acc, [request.status]: acc[request.status] + 1 }),
    { New: 0, Reviewing: 0 },
  );

  // "What needs doing now", not vanity totals.
  const attention: AttentionItem[] = [];
  if (counts.New > 0) {
    attention.push({
      href: "/admin/requests#status-New",
      text: `${counts.New} ${plural(counts.New, "новая заявка ждёт", "новые заявки ждут", "новых заявок ждут")} ответа`,
      tone: "accent",
    });
  }
  for (const project of projectsWithoutLead(projects)) {
    attention.push({
      href: `/admin/projects/${project.id}`,
      text: `${project.name} — нет тимлида`,
      tone: "warn",
    });
  }
  const idle = idleMembers(roster, projects).length;
  if (idle > 0) {
    attention.push({
      href: "/admin/members",
      text: `${idle} ${plural(idle, "участник", "участника", "участников")} без проектов`,
      tone: "muted",
    });
  }

  const inProgress = projects.filter((project) => project.project_status === "In_progress");
  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <header className={scss.intro}>
        <h1 className={scss.intro__title}>Обзор</h1>
        <p className={scss.intro__date}>{today}</p>
      </header>

      <section className={scss.block} aria-labelledby="funnel-title">
        <div className={scss.block__head}>
          <h2 id="funnel-title" className={scss.block__title}>
            Путь заявок
          </h2>
          <Link href="/admin/requests" className={scss.block__link}>
            Все заявки <ArrowRightIcon />
          </Link>
        </div>
        <RequestFunnel counts={counts} />
      </section>

      <div className={scss.grid}>
        <section className={scss.block} aria-labelledby="attention-title">
          <div className={scss.block__head}>
            <h2 id="attention-title" className={scss.block__title}>
              Требует внимания
            </h2>
          </div>
          {attention.length === 0 ? (
            <p className={scss.allClear}>Всё разобрано — новых задач нет.</p>
          ) : (
            <ul className={scss.attention}>
              {attention.map((item) => (
                <li key={item.text} className={scss.attention__item}>
                  <Link href={item.href} className={scss.attention__link}>
                    <span
                      className={`${scss.attention__dot} ${item.tone !== "accent" ? scss[`attention__dot--${item.tone}`] : ""}`}
                      aria-hidden="true"
                    />
                    {item.text}
                    <span className={scss.attention__arrow}>
                      <ArrowRightIcon />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={scss.block} aria-labelledby="active-title">
          <div className={scss.block__head}>
            <h2 id="active-title" className={scss.block__title}>
              Проекты в работе
            </h2>
            <Link href="/admin/projects" className={scss.block__link}>
              Все проекты <ArrowRightIcon />
            </Link>
          </div>
          {inProgress.length === 0 ? (
            <p className={scss.allClear}>Сейчас ничего не в работе.</p>
          ) : (
            <ul className={scss.projects}>
              {inProgress.map((project) => {
                const team = withPeople(project.members, roster);
                const lead = team.find((person) => person.role === "Team_Lead");
                return (
                  <li key={project.id} className={scss.projects__item}>
                    <Link href={`/admin/projects/${project.id}`} className={scss.projects__link}>
                      <span>
                        <span className={scss.projects__name}>{project.name}</span>
                        <span className={scss.projects__lead}>
                          {lead ? ` · ${fullName(lead.member)}` : " · без тимлида"}
                        </span>
                      </span>
                      <AvatarStack
                        people={team.map(({ member }) => ({
                          name: fullName(member),
                          avatar: member.avatar,
                        }))}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
};

export default Page;
```

- [ ] **Step 4: Layout counts and nav**

`app/(admin)/admin/layout.tsx` (full rewrite):
```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/src/components/admin/AdminShell";
import { getClientRequests } from "@/src/server/api/client-requests";
import { getMembers } from "@/src/server/api/members";
import { getProjects } from "@/src/server/api/projects";
import { getTeams } from "@/src/server/api/teams";
import { requireAdmin } from "@/src/server/auth/dal";

export const metadata: Metadata = {
  title: "Админка — Motion Community",
  robots: { index: false, follow: false },
};

// Members are counted from /members/, not /admin/members/: a blocked admin
// endpoint must not take the whole admin down.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const [members, teams, projects, requests] = await Promise.all([
    getMembers(true),
    getTeams(),
    getProjects(true),
    getClientRequests(),
  ]);
  const counts = {
    members: members.filter((member) => member.status === "Active").length,
    teams: teams.length,
    projects: projects.length,
    newRequests: requests.filter((request) => request.status === "New").length,
  };
  return <AdminShell counts={counts}>{children}</AdminShell>;
}
```

`src/components/admin/AdminNav.tsx`:
- delete the `{ href: "/admin/settings", label: "Настройки", icon: <SettingsIcon /> },` entry;
- remove `SettingsIcon` from the `./icons` import.

`src/components/admin/icons.tsx`: delete the `SettingsIcon` export.

Then:
```bash
git rm "app/(admin)/admin/settings/page.tsx"
```

- [ ] **Step 5: Tests, type check, smoke test**

Run: `bun run test && bunx next typegen && bunx tsc --noEmit`
Expected: PASS, exit 0.

With the dev server running:
```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://localhost:3000/admin
```
Expected: `307 http://localhost:3000/login`.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AvatarStack.tsx src/components/admin/overview src/components/admin/AdminNav.tsx src/components/admin/icons.tsx src/components/admin/projects/ProjectCard.tsx "app/(admin)/admin/page.tsx" "app/(admin)/admin/layout.tsx"
git status --short   # the settings page deletion is already staged by git rm
git commit -m "feat: build the admin overview and nav counts from the api" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: Admin — projects and teams

Projects and teams share the membership editor, so they move together.

**Files:**
- Create:
  - `src/server/validation/membership.ts`, `src/server/validation/membership.test.ts`
  - `src/components/admin/ui/DeleteButton.tsx`
- Rewrite:
  - validation: `src/server/validation/project.ts`, `project.test.ts`, `team.ts`, `team.test.ts`
  - actions: `src/actions/admin/projects.ts`, `src/actions/admin/teams.ts`
  - components:
    - `src/components/admin/MembershipEditor.tsx`, `src/components/admin/membership-rows.ts`, `src/components/admin/PersonCell.tsx`
    - `src/components/admin/projects/ProjectCard.tsx`, `src/components/admin/projects/ProjectForm.tsx`
    - `src/components/admin/teams/TeamForm.tsx`
  - pages: `app/(admin)/admin/projects/{page,new/page,[id]/page}.tsx`, `app/(admin)/admin/teams/{page,new/page,[id]/page}.tsx`
- Modify:
  - `src/server/validation/form.ts`: add `nullableUrl`.
  - `app/(admin)/admin/members/page.tsx`: rename one `PersonCell` prop, until Task 20.

**Interfaces:**
- Consumes:
  - Task 6: project and team resource functions, `getMembers(true)`, `ProjectDetail`, `MemberListItem`, `Membership`.
  - Task 17: `refreshAfterAdminChange`, `toFormError`, `toActionError`.
- Produces:
  - `nullableUrl(max = 200)`: blank → `null`.
  - `parseMembership(formData) → { user: number; role: MembershipRole }`.
  - `parseProject(formData)`: API field names.
  - `parseTeam(formData) → { team_name, description }`.
  - `<DeleteButton label confirmLabel action />`: two-step confirm, submitted as a form action.
  - `MembershipRow { userId: number; name; caption; role }`, `Candidate { userId: number; name }`.
  - `toMembershipRows(memberships, roster)`, `toCandidates(roster, memberships)`.
  - `PersonCell` props `{ avatar: string | null; name: string; caption?: string }`.

- [ ] **Step 1: Write the failing tests**

`src/server/validation/membership.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { parseMembership } from "./membership";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

describe("parseMembership", () => {
  it("reads the user id as a number", () => {
    const result = parseMembership(form({ user: "3", role: "Team_Lead" }));
    expect(result.success && result.data).toEqual({ user: 3, role: "Team_Lead" });
  });

  it("requires a user and a known role", () => {
    expect(parseMembership(form({ user: "", role: "Developer" })).success).toBe(false);
    expect(parseMembership(form({ user: "3", role: "OWNER" })).success).toBe(false);
  });
});
```

`src/server/validation/team.test.ts` (full rewrite):
```ts
import { describe, expect, it } from "vitest";
import { parseTeam } from "./team";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

describe("parseTeam", () => {
  it("requires a team_name of 2+ characters", () => {
    expect(parseTeam(form({ team_name: "A", description: "" })).success).toBe(false);
    expect(parseTeam(form({ team_name: "Команда А", description: "" })).success).toBe(true);
  });
});
```

`src/server/validation/project.test.ts` (full rewrite):
```ts
import { describe, expect, it } from "vitest";
import { parseProject } from "./project";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

const valid = {
  name: "Motion CRM",
  description: "Учёт клиентов и сделок для отдела продаж.",
  project_status: "In_progress",
  category: "Web",
  demo_url: "",
  github_url: "https://github.com/motion/crm",
};

describe("parseProject", () => {
  it("accepts API field names and turns blank URLs into null", () => {
    const result = parseProject(form(valid));
    expect(result.success && result.data).toEqual({ ...valid, demo_url: null });
  });

  it("rejects an unknown status, a blank category and a broken URL", () => {
    const result = parseProject(form({ ...valid, project_status: "DONE", category: " ", demo_url: "demo" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["category", "demo_url", "project_status"]);
    }
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun run test src/server/validation`
Expected: FAIL — `./membership` missing; the old schemas use other field names.

- [ ] **Step 3: Validation**

Append to `src/server/validation/form.ts`:
```ts
// Blank → null: the API clears a nullable URL only when it receives null.
export const nullableUrl = (max = 200) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.url("Введите ссылку целиком, с https://").max(max, `Не больше ${max} символов`).nullable(),
  );
```

`src/server/validation/membership.ts`:
```ts
import { z } from "zod";
import { MEMBERSHIP_ROLES } from "@/src/lib/api-enums";
import { parseForm } from "./form";

// Shared by teams and projects: `user` and `role` exactly as the API takes them.
const membershipSchema = z.object({
  user: z.coerce.number({ error: "Выберите участника" }).int().positive("Выберите участника"),
  role: z.enum(MEMBERSHIP_ROLES, "Выберите роль"),
});

export const parseMembership = (formData: FormData) => parseForm(membershipSchema, formData);
```

`src/server/validation/team.ts` (full rewrite):
```ts
import { z } from "zod";
import { parseForm, requiredText } from "./form";

// Field names and limits from the API's TeamDetail.
const teamSchema = z.object({
  team_name: requiredText(2, 255, "Название"),
  description: z.string().trim().max(2000, "Не больше 2000 символов"),
});

export type TeamFields = z.infer<typeof teamSchema>;

export const parseTeam = (formData: FormData) => parseForm(teamSchema, formData);
```

`src/server/validation/project.ts` (full rewrite):
```ts
import { z } from "zod";
import { PROJECT_STATUSES } from "@/src/lib/api-enums";
import { nullableUrl, parseForm, requiredText } from "./form";

// Field names and limits from the API's ProjectDetail.
const projectSchema = z.object({
  name: requiredText(2, 150, "Название"),
  description: requiredText(10, 2000, "Описание"),
  project_status: z.enum(PROJECT_STATUSES, "Выберите статус"),
  category: requiredText(1, 150, "Категория"),
  demo_url: nullableUrl(),
  github_url: nullableUrl(),
});

export type ProjectFields = z.infer<typeof projectSchema>;

export const parseProject = (formData: FormData) => parseForm(projectSchema, formData);
```

- [ ] **Step 4: Run the validation tests**

Run: `bun run test src/server/validation`
Expected: PASS for membership, team and project; `member.test.ts` still passes (untouched).

- [ ] **Step 5: Actions**

`src/actions/admin/projects.ts` (full rewrite):
```ts
"use server";

import { redirect } from "next/navigation";
import {
  addProjectMember,
  createProject,
  deleteProject,
  removeProjectMember,
  updateProject,
} from "@/src/server/api/projects";
import { requireAdmin } from "@/src/server/auth/dal";
import { parseMembership } from "@/src/server/validation/membership";
import { parseProject } from "@/src/server/validation/project";
import { echoValues, type ActionResult, type FormState } from "./form-state";
import { toActionError, toFormError } from "./handle-error";
import { refreshAfterAdminChange } from "./refresh";

export async function createProjectAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseProject(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  let id: number;
  try {
    id = await createProject(parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshAfterAdminChange();
  redirect(`/admin/projects/${id}`);
}

export async function updateProjectAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseProject(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await updateProject(id, parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshAfterAdminChange();
  return { ok: true, values };
}

export async function deleteProjectAction(id: number, _prev: ActionResult): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteProject(id);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  redirect("/admin/projects");
}

export async function addProjectMemberAction(
  projectId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseMembership(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await addProjectMember(projectId, parsed.data.user, parsed.data.role);
  } catch (error) {
    return toFormError(error, {});
  }
  refreshAfterAdminChange();
  return { ok: true };
}

export async function removeProjectMemberAction(projectId: number, userId: number): Promise<ActionResult> {
  await requireAdmin();
  try {
    await removeProjectMember(projectId, userId);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  return {};
}
```

`src/actions/admin/teams.ts` (full rewrite):
```ts
"use server";

import { redirect } from "next/navigation";
import {
  addTeamMember,
  createTeam,
  deleteTeam,
  removeTeamMember,
  updateTeam,
} from "@/src/server/api/teams";
import { requireAdmin } from "@/src/server/auth/dal";
import { parseMembership } from "@/src/server/validation/membership";
import { parseTeam } from "@/src/server/validation/team";
import { echoValues, type ActionResult, type FormState } from "./form-state";
import { toActionError, toFormError } from "./handle-error";
import { refreshAfterAdminChange } from "./refresh";

export async function createTeamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseTeam(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  let id: number;
  try {
    id = await createTeam(parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshAfterAdminChange();
  redirect(`/admin/teams/${id}`);
}

export async function updateTeamAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseTeam(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await updateTeam(id, parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshAfterAdminChange();
  return { ok: true, values };
}

export async function deleteTeamAction(id: number, _prev: ActionResult): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteTeam(id);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  redirect("/admin/teams");
}

export async function addTeamMemberAction(
  teamId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseMembership(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await addTeamMember(teamId, parsed.data.user, parsed.data.role);
  } catch (error) {
    return toFormError(error, {});
  }
  refreshAfterAdminChange();
  return { ok: true };
}

export async function removeTeamMemberAction(teamId: number, userId: number): Promise<ActionResult> {
  await requireAdmin();
  try {
    await removeTeamMember(teamId, userId);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  return {};
}
```

- [ ] **Step 6: Shared admin components**

`src/components/admin/ui/DeleteButton.tsx`:
```tsx
"use client";

import { FC, useActionState, useState } from "react";
import type { ActionResult } from "@/src/actions/admin/form-state";
import scss from "./admin-ui.module.scss";

interface DeleteButtonProps {
  label: string;
  confirmLabel: string;
  action: (prev: ActionResult) => Promise<ActionResult>;
}

// Like ConfirmButton, but the commitment is a real form submit: the
// Server Action redirects away on success, which form actions handle
// natively.
const DeleteButton: FC<DeleteButtonProps> = ({ label, confirmLabel, action }) => {
  const [asking, setAsking] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});
  const error = !pending && state.error;

  return (
    <span className={scss.confirm}>
      {asking ? (
        <form action={formAction} className={scss.confirm}>
          <button
            type="submit"
            className={`${scss.smallButton} ${scss["smallButton--dangerSolid"]}`}
            disabled={pending}
          >
            {pending ? "…" : confirmLabel}
          </button>
          <button
            type="button"
            className={scss.smallButton}
            disabled={pending}
            onClick={() => setAsking(false)}
          >
            Отмена
          </button>
        </form>
      ) : (
        <button
          type="button"
          className={`${scss.smallButton} ${scss["smallButton--danger"]}`}
          onClick={() => setAsking(true)}
        >
          {label}
        </button>
      )}
      {error && (
        <span role="alert" className={scss.field__error}>
          {error}
        </span>
      )}
    </span>
  );
};

export default DeleteButton;
```

`src/components/admin/PersonCell.tsx` (full rewrite):
```tsx
import { FC } from "react";
import Avatar from "@/src/ui/Avatar";
import scss from "./ui/admin-ui.module.scss";

interface PersonCellProps {
  avatar: string | null;
  name: string;
  caption?: string;
}

const PersonCell: FC<PersonCellProps> = ({ avatar, name, caption }) => (
  <span className={scss.person}>
    <span className={scss.person__avatar}>
      <Avatar src={avatar} name={name} imageClassName={scss.person__img} />
    </span>
    <span className={scss.person__text}>
      <span className={scss.person__name}>{name}</span>
      {caption && <span className={scss.person__caption}>{caption}</span>}
    </span>
  </span>
);

export default PersonCell;
```
In the old `app/(admin)/admin/members/page.tsx`, rename the prop `photo={profile.photo}` to `avatar={profile.photo}`. Task 20 rewrites that page.

`src/components/admin/MembershipEditor.tsx` (full rewrite):
```tsx
"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState } from "react";
import Link from "next/link";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { MEMBERSHIP_ROLES, type MembershipRole } from "@/src/lib/api-enums";
import { MEMBERSHIP_ROLE_LABELS } from "@/src/lib/api-labels";
import type { ActionResult, FormState } from "@/src/actions/admin/form-state";

export interface MembershipRow {
  userId: number;
  name: string;
  caption: string;
  role: MembershipRole;
}

export interface Candidate {
  userId: number;
  name: string;
}

interface MembershipEditorProps {
  rows: MembershipRow[];
  candidates: Candidate[];
  addAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  removeAction: (userId: number) => Promise<ActionResult>;
}

const ROLE_OPTIONS = MEMBERSHIP_ROLES.map((value) => ({ value, label: MEMBERSHIP_ROLE_LABELS[value] }));

// The API can add and remove people but can't change a role in place, so
// the role is a badge: to change it, remove the person and add them again.
const MembershipEditor: FC<MembershipEditorProps> = ({ rows, candidates, addAction, removeAction }) => {
  const [state, formAction, pending] = useActionState(addAction, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});

  return (
    <div className={scss.membership}>
      {rows.length === 0 ? (
        <p className={scss.empty}>Пока никого нет — добавьте участников ниже.</p>
      ) : (
        <ul className={scss.membership__list}>
          {rows.map((row) => (
            <li key={row.userId} className={scss.membership__row}>
              <div>
                <Link href={`/admin/members/${row.userId}`} className={scss.table__link}>
                  {row.name}
                </Link>
                {row.caption && <p className={scss.field__hint}>{row.caption}</p>}
              </div>
              <StatusBadge tone={row.role === "Team_Lead" ? "accent" : "neutral"}>
                {MEMBERSHIP_ROLE_LABELS[row.role]}
              </StatusBadge>
              <ConfirmButton
                label="Убрать"
                confirmLabel="Да, убрать"
                danger
                onConfirm={() => removeAction(row.userId)}
              />
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className={scss.membership__add} noValidate>
        <div className={scss.field}>
          <label htmlFor="membership-user">Участник</label>
          {/* Keyed by the last result so a successful add clears the choice. */}
          <Select
            key={JSON.stringify(state)}
            id="membership-user"
            name="user"
            defaultValue=""
            invalid={Boolean(errors.user)}
            describedBy={errors.user ? "membership-user-error" : undefined}
            block
            options={candidates.map((candidate) => ({
              value: String(candidate.userId),
              label: candidate.name,
            }))}
          />
          {errors.user && (
            <p id="membership-user-error" className={scss.field__error}>
              {errors.user}
            </p>
          )}
        </div>
        <div className={scss.field}>
          <label htmlFor="membership-role">Роль</label>
          <Select id="membership-role" name="role" defaultValue="Developer" block options={ROLE_OPTIONS} />
        </div>
        <button
          type="submit"
          className={`${scss.smallButton} ${scss["smallButton--solid"]}`}
          disabled={pending}
        >
          {pending ? "Добавляем…" : "Добавить"}
        </button>
        {state.error && !pending && (
          <p role="alert" className={scss.field__error}>
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
};

export default MembershipEditor;
```

`src/components/admin/membership-rows.ts` (full rewrite):
```ts
import { positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import type { MemberListItem, Membership } from "@/src/server/api/schemas";
import type { Candidate, MembershipRow } from "./MembershipEditor";

// Every membership stays visible, even for someone missing from the
// roster (e.g. deactivated), so the admin can still remove them.
export function toMembershipRows(memberships: Membership[], roster: MemberListItem[]): MembershipRow[] {
  const byId = new Map(roster.map((member) => [member.id, member]));
  return memberships
    .map((row) => {
      const member = byId.get(row.user);
      return {
        userId: row.user,
        name: member ? fullName(member) : `Участник #${row.user}`,
        caption: member ? (positionLabel(member.position) ?? "") : "нет в списке участников",
        role: row.role,
      };
    })
    .sort((a, b) => Number(b.role === "Team_Lead") - Number(a.role === "Team_Lead"));
}

// Only active people who aren't in the list yet can be added.
export const toCandidates = (roster: MemberListItem[], memberships: Membership[]): Candidate[] =>
  roster
    .filter((member) => member.status === "Active" && !memberships.some((row) => row.user === member.id))
    .map((member) => ({ userId: member.id, name: fullName(member) }));
```

- [ ] **Step 7: Project components and pages**

`src/components/admin/projects/ProjectCard.tsx` (full rewrite):
```tsx
import { FC } from "react";
import Link from "next/link";
import AvatarStack from "@/src/components/admin/AvatarStack";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import ProjectCover from "@/src/ui/ProjectCover";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import type { TeamPerson } from "@/src/server/api/joins";
import type { ProjectDetail } from "@/src/server/api/schemas";
import scss from "./ProjectCard.module.scss";

const ProjectCard: FC<{ project: ProjectDetail; team: TeamPerson[] }> = ({ project, team }) => {
  const lead = team.find((person) => person.role === "Team_Lead");
  return (
    <Link href={`/admin/projects/${project.id}`} className={scss.card}>
      <span className={scss.card__media}>
        <ProjectCover src={project.preview_image} name={project.name} imageClassName={scss.card__image} />
        <span className={scss.card__status}>
          <StatusBadge tone={PROJECT_STATUS_TONE[project.project_status]}>
            {PROJECT_STATUS_LABELS[project.project_status]}
          </StatusBadge>
        </span>
      </span>
      <span className={scss.card__body}>
        <span className={scss.card__meta}>{project.category}</span>
        <span className={scss.card__name}>{project.name}</span>
        <span className={scss.card__footer}>
          <AvatarStack
            people={team.map(({ member }) => ({ name: fullName(member), avatar: member.avatar }))}
          />
          <span className={`${scss.card__lead} ${lead ? "" : scss["card__lead--missing"]}`}>
            {lead ? `Тимлид: ${fullName(lead.member)}` : "Нет тимлида"}
          </span>
        </span>
      </span>
    </Link>
  );
};

export default ProjectCard;
```

`src/components/admin/projects/ProjectForm.tsx` (full rewrite):
```tsx
"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import FormSection from "@/src/components/admin/ui/FormSection";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import type { FormState } from "@/src/actions/admin/form-state";
import { PROJECT_STATUSES } from "@/src/lib/api-enums";
import { PROJECT_STATUS_LABELS } from "@/src/lib/api-labels";

export interface ProjectFormValues {
  name: string;
  description: string;
  project_status: string;
  category: string;
  demo_url: string;
  github_url: string;
}

interface ProjectFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: ProjectFormValues;
  // Existing categories, offered as suggestions: the API takes any text.
  categories: string[];
  submitLabel: string;
}

const STATUS_OPTIONS = PROJECT_STATUSES.map((value) => ({ value, label: PROJECT_STATUS_LABELS[value] }));

const ProjectForm: FC<ProjectFormProps> = ({ action, initial, categories, submitLabel }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});
  const value = (name: keyof ProjectFormValues) => state.values?.[name] ?? initial[name];
  const control = (name: keyof ProjectFormValues) => ({
    id: `project-${name}`,
    name,
    defaultValue: value(name),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `project-${name}-error` : undefined,
  });

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      <FormSection title="О проекте" />
      <Field label="Название" htmlFor="project-name" required error={errors.name}>
        <input {...control("name")} />
      </Field>
      <Field
        label="Категория"
        htmlFor="project-category"
        required
        error={errors.category}
        hint="Например, Web, Mobile, Education"
      >
        <input {...control("category")} list="project-categories" />
        <datalist id="project-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </Field>
      <Field label="Описание" htmlFor="project-description" required error={errors.description} full>
        <textarea {...control("description")} rows={4} />
      </Field>

      <FormSection title="Публикация" hint="Статус виден в портфолио на сайте." />
      <Field label="Статус" htmlFor="project-project_status" required error={errors.project_status}>
        <Select
          id="project-project_status"
          name="project_status"
          defaultValue={value("project_status")}
          invalid={Boolean(errors.project_status)}
          describedBy={errors.project_status ? "project-project_status-error" : undefined}
          block
          options={STATUS_OPTIONS}
        />
      </Field>

      <FormSection title="Ссылки" hint="Необязательно. Пустые ссылки на сайте не показываются." />
      <Field label="Демо" htmlFor="project-demo_url" error={errors.demo_url}>
        <input {...control("demo_url")} type="url" placeholder="https://…" />
      </Field>
      <Field label="GitHub" htmlFor="project-github_url" error={errors.github_url}>
        <input {...control("github_url")} type="url" placeholder="https://github.com/…" />
      </Field>

      <FormActions submitLabel={submitLabel} pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default ProjectForm;
```

`app/(admin)/admin/projects/page.tsx` (full rewrite):
```tsx
import Button from "@/src/ui/Button";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import EmptyState from "@/src/components/admin/ui/EmptyState";
import ProjectCard from "@/src/components/admin/projects/ProjectCard";
import cards from "@/src/components/admin/projects/ProjectCard.module.scss";
import { plural } from "@/src/lib/plural";
import { withPeople } from "@/src/server/api/joins";
import { getMembers } from "@/src/server/api/members";
import { getProjectsWithMembers } from "@/src/server/api/projects";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  const [projects, roster] = await Promise.all([getProjectsWithMembers(true), getMembers(true)]);
  return (
    <>
      <PageHeader
        title="Проекты"
        description={`${projects.length} ${plural(projects.length, "проект", "проекта", "проектов")} в портфолио сообщества`}
        action={
          <Button href="/admin/projects/new" variant="primary">
            Создать проект
          </Button>
        }
      />
      {projects.length === 0 ? (
        <EmptyState title="Проектов пока нет" />
      ) : (
        <div className={cards.grid}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} team={withPeople(project.members, roster)} />
          ))}
        </div>
      )}
    </>
  );
};

export default Page;
```

`app/(admin)/admin/projects/new/page.tsx` (full rewrite):
```tsx
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import ProjectForm from "@/src/components/admin/projects/ProjectForm";
import { createProjectAction } from "@/src/actions/admin/projects";
import { getProjects } from "@/src/server/api/projects";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  const projects = await getProjects(true);
  return (
    <>
      <PageHeader title="Новый проект" back={{ href: "/admin/projects", label: "Проекты" }} />
      <Panel>
        <ProjectForm
          action={createProjectAction}
          submitLabel="Создать проект"
          categories={[...new Set(projects.map((project) => project.category))]}
          initial={{
            name: "",
            description: "",
            project_status: "Planned",
            category: "",
            demo_url: "",
            github_url: "",
          }}
        />
      </Panel>
    </>
  );
};

export default Page;
```

`app/(admin)/admin/projects/[id]/page.tsx` (full rewrite):
```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import ProjectForm from "@/src/components/admin/projects/ProjectForm";
import MembershipEditor from "@/src/components/admin/MembershipEditor";
import DeleteButton from "@/src/components/admin/ui/DeleteButton";
import { toCandidates, toMembershipRows } from "@/src/components/admin/membership-rows";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import {
  addProjectMemberAction,
  deleteProjectAction,
  removeProjectMemberAction,
  updateProjectAction,
} from "@/src/actions/admin/projects";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE } from "@/src/lib/api-labels";
import { parseId } from "@/src/lib/route-id";
import { getMembers } from "@/src/server/api/members";
import { getProject, getProjectMembers, getProjects } from "@/src/server/api/projects";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async ({ params }: PageProps<"/admin/projects/[id]">) => {
  await requireAdmin();
  const id = parseId((await params).id);
  const project = id === null ? null : await getProject(id, true);
  if (!project) notFound();

  const [memberships, roster, projects] = await Promise.all([
    getProjectMembers(project.id),
    getMembers(true),
    getProjects(true),
  ]);

  return (
    <>
      <PageHeader
        title={project.name}
        back={{ href: "/admin/projects", label: "Проекты" }}
        description={`${project.category} · ${project.created_at.slice(0, 4)}`}
        meta={
          <StatusBadge tone={PROJECT_STATUS_TONE[project.project_status]}>
            {PROJECT_STATUS_LABELS[project.project_status]}
          </StatusBadge>
        }
        action={
          <Link href={`/projects/${project.id}`} target="_blank" className={scss.smallButton}>
            Открыть на сайте ↗
          </Link>
        }
      />
      <Panel title="Проект">
        <ProjectForm
          action={updateProjectAction.bind(null, project.id)}
          submitLabel="Сохранить"
          categories={[...new Set(projects.map((item) => item.category))]}
          initial={{
            name: project.name,
            description: project.description,
            project_status: project.project_status,
            category: project.category,
            demo_url: project.demo_url ?? "",
            github_url: project.github_url ?? "",
          }}
        />
      </Panel>
      <Panel title="Участники проекта">
        <MembershipEditor
          rows={toMembershipRows(memberships, roster)}
          candidates={toCandidates(roster, memberships)}
          addAction={addProjectMemberAction.bind(null, project.id)}
          removeAction={removeProjectMemberAction.bind(null, project.id)}
        />
      </Panel>
      <Panel title="Удаление">
        <p className={scss.field__hint}>Проект исчезнет с сайта вместе с составом команды.</p>
        <DeleteButton
          label="Удалить проект"
          confirmLabel="Да, удалить"
          action={deleteProjectAction.bind(null, project.id)}
        />
      </Panel>
    </>
  );
};

export default Page;
```

- [ ] **Step 8: Team components and pages**

`src/components/admin/teams/TeamForm.tsx` (full rewrite):
```tsx
"use client";

import { FC, useActionState } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import type { FormState } from "@/src/actions/admin/form-state";

export interface TeamFormValues {
  team_name: string;
  description: string;
}

interface TeamFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: TeamFormValues;
  submitLabel: string;
}

const TeamForm: FC<TeamFormProps> = ({ action, initial, submitLabel }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});
  const value = (name: keyof TeamFormValues) => state.values?.[name] ?? initial[name];

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      <Field label="Название" htmlFor="team-team_name" required error={errors.team_name} full>
        <input
          id="team-team_name"
          name="team_name"
          defaultValue={value("team_name")}
          aria-invalid={Boolean(errors.team_name)}
          aria-describedby={errors.team_name ? "team-team_name-error" : undefined}
        />
      </Field>
      <Field label="Описание" htmlFor="team-description" error={errors.description} full>
        <textarea
          id="team-description"
          name="description"
          rows={3}
          defaultValue={value("description")}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "team-description-error" : undefined}
        />
      </Field>
      <FormActions submitLabel={submitLabel} pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default TeamForm;
```

`app/(admin)/admin/teams/page.tsx` (full rewrite):
```tsx
import Button from "@/src/ui/Button";
import DataTable from "@/src/components/admin/ui/DataTable";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import PersonCell from "@/src/components/admin/PersonCell";
import { getTeams } from "@/src/server/api/teams";
import type { TeamListItem } from "@/src/server/api/schemas";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  const teams = await getTeams();
  return (
    <>
      <PageHeader
        title="Команды"
        description="Внутренние команды сообщества. На сайте «Команды по проектам» собираются из участников проектов — их состав меняется в разделе «Проекты»."
        action={
          <Button href="/admin/teams/new" variant="primary">
            Создать команду
          </Button>
        }
      />
      <DataTable<TeamListItem>
        rows={teams}
        rowKey={(row) => String(row.id)}
        rowHref={(row) => `/admin/teams/${row.id}`}
        empty="Команд пока нет."
        columns={[
          {
            key: "name",
            label: "Команда",
            render: (row) => <PersonCell avatar={row.team_image} name={row.team_name} />,
          },
        ]}
      />
    </>
  );
};

export default Page;
```

`app/(admin)/admin/teams/new/page.tsx` (full rewrite):
```tsx
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import TeamForm from "@/src/components/admin/teams/TeamForm";
import { createTeamAction } from "@/src/actions/admin/teams";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Новая команда" back={{ href: "/admin/teams", label: "Команды" }} />
      <Panel>
        <TeamForm
          action={createTeamAction}
          initial={{ team_name: "", description: "" }}
          submitLabel="Создать команду"
        />
      </Panel>
    </>
  );
};

export default Page;
```

`app/(admin)/admin/teams/[id]/page.tsx` (full rewrite):
```tsx
import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import TeamForm from "@/src/components/admin/teams/TeamForm";
import MembershipEditor from "@/src/components/admin/MembershipEditor";
import DeleteButton from "@/src/components/admin/ui/DeleteButton";
import { toCandidates, toMembershipRows } from "@/src/components/admin/membership-rows";
import { formatDate } from "@/src/components/admin/labels";
import {
  addTeamMemberAction,
  deleteTeamAction,
  removeTeamMemberAction,
  updateTeamAction,
} from "@/src/actions/admin/teams";
import { parseId } from "@/src/lib/route-id";
import { getMembers } from "@/src/server/api/members";
import { getTeam, getTeamMembers } from "@/src/server/api/teams";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async ({ params }: PageProps<"/admin/teams/[id]">) => {
  await requireAdmin();
  const id = parseId((await params).id);
  const team = id === null ? null : await getTeam(id);
  if (!team) notFound();

  const [memberships, roster] = await Promise.all([getTeamMembers(team.id), getMembers(true)]);

  return (
    <>
      <PageHeader
        title={team.team_name}
        back={{ href: "/admin/teams", label: "Команды" }}
        description={`Создана ${formatDate(team.created_at)}`}
      />
      <Panel title="Команда">
        <TeamForm
          action={updateTeamAction.bind(null, team.id)}
          initial={{ team_name: team.team_name, description: team.description }}
          submitLabel="Сохранить"
        />
      </Panel>
      <Panel title="Состав">
        <MembershipEditor
          rows={toMembershipRows(memberships, roster)}
          candidates={toCandidates(roster, memberships)}
          addAction={addTeamMemberAction.bind(null, team.id)}
          removeAction={removeTeamMemberAction.bind(null, team.id)}
        />
      </Panel>
      <Panel title="Удаление">
        <DeleteButton
          label="Удалить команду"
          confirmLabel="Да, удалить"
          action={deleteTeamAction.bind(null, team.id)}
        />
      </Panel>
    </>
  );
};

export default Page;
```

- [ ] **Step 9: Tests and the type check**

Run: `bun run test && bunx next typegen && bunx tsc --noEmit`
Expected: PASS, exit 0.

- [ ] **Step 10: Commit**

```bash
git add src/server/validation src/actions/admin/projects.ts src/actions/admin/teams.ts src/components/admin "app/(admin)/admin/projects" "app/(admin)/admin/teams" "app/(admin)/admin/members/page.tsx"
git commit -m "feat: manage projects, teams and memberships through the api" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Admin — members (with the blocked state)

**Files:**
- Create:
  - `src/components/admin/members/MemberCreateForm.tsx`, `MemberProfileForm.tsx`, `MembersUnavailable.tsx`
  - `src/server/api/admin-members.test.ts`
- Modify: `src/server/api/admin-members.ts` (add `loadMembersSection`)
- Rewrite:
  - `src/server/validation/member.ts`, `src/server/validation/member.test.ts`
  - `src/actions/admin/members.ts`
  - `src/components/admin/members/{MemberSidebar,EditProfileDialog,MemberProfileView}.tsx`
  - `app/(admin)/admin/members/{page,new/page,[id]/page}.tsx`
- Delete: `src/components/admin/members/MemberForm.tsx`

**Interfaces:**
- Consumes:
  - Task 6: admin-member resources, `getMember(id, true)`, `getMembers(true)`, `getProjectsWithMembers(true)`, `setMemberStatus`, `splitSkills`.
  - Task 17: `refreshAfterAdminChange`, `toFormError`, `toActionError`.
  - Task 19: `PersonCell`, `DeleteButton`.
- Produces:
  - `type MembersSection<T> = { blocked: false; data: T } | { blocked: true }` and `loadMembersSection(promise)`;
  - `parseMemberCreate` → `{ login, password, role }`;
  - `parseMemberProfile` → `AdminMemberPatch`-compatible fields;
  - `parseRole`.

- [ ] **Step 1: Write the failing tests**

`src/server/api/admin-members.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./errors";
import { loadMembersSection } from "./admin-members";

vi.mock("./client", () => ({ authedGet: vi.fn(), authedSend: vi.fn(), authedDelete: vi.fn() }));

describe("loadMembersSection", () => {
  it("passes data through", async () => {
    await expect(loadMembersSection(Promise.resolve([1]))).resolves.toEqual({ blocked: false, data: [1] });
  });

  it("reports the Django-admin redirect as blocked", async () => {
    await expect(
      loadMembersSection(Promise.reject(new ApiError("redirected", 302, "GET /admin/members/ → 302"))),
    ).resolves.toEqual({ blocked: true });
  });

  it("rethrows everything else", async () => {
    const error = new ApiError("unavailable", 503, "x");
    await expect(loadMembersSection(Promise.reject(error))).rejects.toBe(error);
  });
});
```

`src/server/validation/member.test.ts` (full rewrite):
```ts
import { describe, expect, it } from "vitest";
import { parseMemberCreate, parseMemberProfile } from "./member";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

const profile = {
  login: "anvar",
  first_name: "Анвар",
  last_name: "Касымов",
  position: "",
  bio: "",
  skills: "React, Next.js",
  github: "",
  linkedin: "https://linkedin.com/in/anvar",
  portfolio: "",
};

describe("member validation", () => {
  it("creates with login, password and role only", () => {
    const result = parseMemberCreate(form({ login: " Anvar.K ", password: "secret-123", role: "Team_Lead" }));
    expect(result.success && result.data).toEqual({ login: "anvar.k", password: "secret-123", role: "Team_Lead" });
  });

  it("rejects a bad login, a short password and an unknown role", () => {
    const result = parseMemberCreate(form({ login: "a b", password: "123", role: "Owner" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["login", "password", "role"]);
    }
  });

  it("parses the profile with null URLs and no position", () => {
    const result = parseMemberProfile(form(profile));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBeUndefined();
      expect(result.data.github).toBeNull();
      expect(result.data.linkedin).toBe("https://linkedin.com/in/anvar");
    }
  });

  it("rejects an unknown position and a broken URL", () => {
    const result = parseMemberProfile(form({ ...profile, position: "Chef", github: "github" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.position).toBeDefined();
      expect(result.fieldErrors.github).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun run test src/server/api/admin-members.test.ts src/server/validation/member.test.ts`
Expected: FAIL — `loadMembersSection` missing; the old member schema differs.

- [ ] **Step 3: Section helper and validation**

Append to `src/server/api/admin-members.ts` (and add `isApiError` to its `./errors` import):
```ts
export type MembersSection<T> = { blocked: false; data: T } | { blocked: true };

// /admin/members/ is shadowed by the Django admin today (302 —
// docs/backend-issues.md #1): the pages explain that instead of crashing.
export async function loadMembersSection<T>(load: Promise<T>): Promise<MembersSection<T>> {
  try {
    return { blocked: false, data: await load };
  } catch (error) {
    if (isApiError(error, "redirected")) return { blocked: true };
    throw error;
  }
}
```

`src/server/validation/member.ts` (full rewrite):
```ts
import { z } from "zod";
import { POSITIONS, USER_ROLES } from "@/src/lib/api-enums";
import { nullableUrl, parseForm, requiredText } from "./form";

export const LOGIN_PATTERN = /^[a-z0-9._-]{3,32}$/;

const login = z
  .string()
  .trim()
  .toLowerCase()
  .regex(LOGIN_PATTERN, "3–32 символа: латиница, цифры, точка, _ или -");

const role = z.enum(USER_ROLES, "Выберите роль");

export const passwordSchema = z
  .string()
  .min(8, "Минимум 8 символов")
  .max(64, "Не больше 64 символов");

// POST /admin/members/ takes exactly these three.
const memberCreateSchema = z.object({ login, password: passwordSchema, role });

// Profile part of PATCH /admin/members/{id}/. A blank position means
// "leave it as it is".
const memberProfileSchema = z.object({
  login,
  first_name: requiredText(1, 150, "Имя"),
  last_name: requiredText(1, 150, "Фамилия"),
  position: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(POSITIONS, "Выберите направление").optional(),
  ),
  bio: z.string().trim().max(2000, "Не больше 2000 символов"),
  skills: z.string().trim().max(500, "Не больше 500 символов"),
  github: nullableUrl(),
  linkedin: nullableUrl(),
  portfolio: nullableUrl(),
});

const roleSchema = z.object({ role });

export type MemberCreateFields = z.infer<typeof memberCreateSchema>;
export type MemberProfileFields = z.infer<typeof memberProfileSchema>;

export const parseMemberCreate = (formData: FormData) => parseForm(memberCreateSchema, formData);
export const parseMemberProfile = (formData: FormData) => parseForm(memberProfileSchema, formData);
export const parseRole = (formData: FormData) => parseForm(roleSchema, formData);
```

- [ ] **Step 4: Run them to see them pass**

Run: `bun run test src/server/api/admin-members.test.ts src/server/validation/member.test.ts`
Expected: PASS.

- [ ] **Step 5: Actions**

`src/actions/admin/members.ts` (full rewrite):
```ts
"use server";

import { redirect } from "next/navigation";
import { USER_STATUSES, type UserStatus } from "@/src/lib/api-enums";
import { createAdminMember, deleteAdminMember, updateAdminMember } from "@/src/server/api/admin-members";
import { setMemberStatus } from "@/src/server/api/members";
import { requireAdmin } from "@/src/server/auth/dal";
import { generatePassword } from "@/src/server/auth/password";
import { parseMemberCreate, parseMemberProfile, parseRole } from "@/src/server/validation/member";
import { echoValues, type ActionResult, type FormState } from "./form-state";
import { toActionError, toFormError } from "./handle-error";
import { refreshAfterAdminChange } from "./refresh";

export async function createMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  // Never echo the password back to the browser.
  delete values.password;
  const parsed = parseMemberCreate(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  let id: number;
  try {
    id = await createAdminMember(parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshAfterAdminChange();
  redirect(`/admin/members/${id}?created=1`);
}

export async function setMemberStatusAction(id: number, status: UserStatus): Promise<ActionResult> {
  await requireAdmin();
  if (!USER_STATUSES.includes(status)) return { error: "Неизвестный статус" };
  try {
    await setMemberStatus(id, status);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  return {};
}

// Returns the new password once so the admin can hand it over.
export async function resetPasswordAction(id: number): Promise<{ password?: string; error?: string }> {
  await requireAdmin();
  const password = generatePassword();
  try {
    await updateAdminMember(id, { password });
  } catch (error) {
    return toActionError(error);
  }
  return { password };
}

export async function generatePasswordAction(): Promise<string> {
  await requireAdmin();
  return generatePassword();
}

export async function updateMemberProfileAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = echoValues(formData);
  const parsed = parseMemberProfile(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors, values };

  try {
    await updateAdminMember(id, parsed.data);
  } catch (error) {
    return toFormError(error, values);
  }
  refreshAfterAdminChange();
  return { ok: true, values };
}

export async function setMemberRoleAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseRole(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await updateAdminMember(id, { role: parsed.data.role });
  } catch (error) {
    return toFormError(error, {});
  }
  refreshAfterAdminChange();
  return { ok: true };
}

export async function deleteMemberAction(id: number, _prev: ActionResult): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteAdminMember(id);
  } catch (error) {
    return toActionError(error);
  }
  refreshAfterAdminChange();
  redirect("/admin/members");
}
```

- [ ] **Step 6: Components**

```bash
git rm src/components/admin/members/MemberForm.tsx
```

`src/components/admin/members/MembersUnavailable.tsx`:
```tsx
import { FC } from "react";
import EmptyState from "@/src/components/admin/ui/EmptyState";

// /admin/members/ answers with a redirect to the Django admin login today
// (docs/backend-issues.md #1); the section waits for that fix.
const MembersUnavailable: FC = () => (
  <EmptyState title="Раздел недоступен">
    <p>
      Бэкенд перенаправляет /admin/members/ на вход в Django-админку — нужна
      правка на стороне бэкенда.
    </p>
  </EmptyState>
);

export default MembersUnavailable;
```

`src/components/admin/members/MemberCreateForm.tsx`:
```tsx
"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState, useRef } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import FormSection from "@/src/components/admin/ui/FormSection";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { generatePasswordAction } from "@/src/actions/admin/members";
import type { FormState } from "@/src/actions/admin/form-state";
import { USER_ROLES } from "@/src/lib/api-enums";
import { USER_ROLE_LABELS } from "@/src/lib/api-labels";

const ROLE_OPTIONS = USER_ROLES.map((value) => ({ value, label: USER_ROLE_LABELS[value] }));

// POST /admin/members/ takes login, password and role; the profile is
// filled in later (by the member, or via «Изменить профиль»).
const MemberCreateForm: FC<{ action: (prev: FormState, formData: FormData) => Promise<FormState> }> = ({
  action,
}) => {
  const [state, formAction, pending] = useActionState(action, {});
  const passwordRef = useRef<HTMLInputElement>(null);
  const errors = pending ? {} : (state.fieldErrors ?? {});

  const fillPassword = async () => {
    const password = await generatePasswordAction();
    if (passwordRef.current) {
      passwordRef.current.value = password;
      passwordRef.current.type = "text";
    }
  };

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      <FormSection title="Доступ" hint="С этими данными участник входит на платформу." />
      <Field label="Логин" htmlFor="member-login" required error={errors.login} hint="Латиница, цифры, . _ -">
        <input
          id="member-login"
          name="login"
          defaultValue={state.values?.login ?? ""}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(errors.login)}
          aria-describedby={errors.login ? "member-login-error" : undefined}
        />
      </Field>
      <Field label="Роль" htmlFor="member-role" required error={errors.role}>
        <Select
          id="member-role"
          name="role"
          defaultValue={state.values?.role ?? "Developer"}
          invalid={Boolean(errors.role)}
          describedBy={errors.role ? "member-role-error" : undefined}
          block
          options={ROLE_OPTIONS}
        />
      </Field>
      <Field label="Пароль" htmlFor="member-password" required error={errors.password} full>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={passwordRef}
            id="member-password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "member-password-error" : undefined}
          />
          <button type="button" className={scss.smallButton} onClick={fillPassword}>
            Сгенерировать
          </button>
        </div>
      </Field>
      <FormActions submitLabel="Создать участника" pending={pending} error={state.error} />
    </form>
  );
};

export default MemberCreateForm;
```

`src/components/admin/members/MemberProfileForm.tsx`:
```tsx
"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState, useEffect } from "react";
import Field from "@/src/components/admin/ui/Field";
import FormActions from "@/src/components/admin/ui/FormActions";
import FormSection from "@/src/components/admin/ui/FormSection";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import type { FormState } from "@/src/actions/admin/form-state";
import { POSITIONS } from "@/src/lib/api-enums";
import { POSITION_LABELS } from "@/src/lib/api-labels";

export interface MemberProfileValues {
  login: string;
  first_name: string;
  last_name: string;
  position: string;
  skills: string;
  bio: string;
  github: string;
  linkedin: string;
  portfolio: string;
}

interface MemberProfileFormProps {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: MemberProfileValues;
  onSaved?: () => void;
}

const POSITION_OPTIONS = [
  { value: "", label: "Не указано" },
  ...POSITIONS.map((value) => ({ value, label: POSITION_LABELS[value] })),
];

const MemberProfileForm: FC<MemberProfileFormProps> = ({ action, initial, onSaved }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = pending ? {} : (state.fieldErrors ?? {});
  const value = (name: keyof MemberProfileValues) => state.values?.[name] ?? initial[name];
  const control = (name: keyof MemberProfileValues) => ({
    id: `member-${name}`,
    name,
    defaultValue: value(name),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `member-${name}-error` : undefined,
  });

  useEffect(() => {
    if (state.ok) onSaved?.();
  }, [state, onSaved]);

  return (
    <form action={formAction} className={scss.formGrid} noValidate>
      <Field label="Логин" htmlFor="member-login" required error={errors.login}>
        <input {...control("login")} autoComplete="off" spellCheck={false} />
      </Field>
      <Field label="Направление" htmlFor="member-position" error={errors.position}>
        <Select
          id="member-position"
          name="position"
          defaultValue={value("position")}
          invalid={Boolean(errors.position)}
          describedBy={errors.position ? "member-position-error" : undefined}
          block
          options={POSITION_OPTIONS}
        />
      </Field>
      <Field label="Имя" htmlFor="member-first_name" required error={errors.first_name}>
        <input {...control("first_name")} />
      </Field>
      <Field label="Фамилия" htmlFor="member-last_name" required error={errors.last_name}>
        <input {...control("last_name")} />
      </Field>
      <Field label="Навыки" htmlFor="member-skills" error={errors.skills} hint="Через запятую" full>
        <input {...control("skills")} />
      </Field>
      <Field label="О себе" htmlFor="member-bio" error={errors.bio} full>
        <textarea {...control("bio")} rows={3} />
      </Field>

      <FormSection title="Ссылки" hint="Необязательно. Пустые ссылки на сайте не показываются." />
      <Field label="GitHub" htmlFor="member-github" error={errors.github}>
        <input {...control("github")} type="url" placeholder="https://github.com/…" />
      </Field>
      <Field label="LinkedIn" htmlFor="member-linkedin" error={errors.linkedin}>
        <input {...control("linkedin")} type="url" placeholder="https://linkedin.com/in/…" />
      </Field>
      <Field label="Портфолио" htmlFor="member-portfolio" error={errors.portfolio}>
        <input {...control("portfolio")} type="url" placeholder="https://…" />
      </Field>

      <FormActions submitLabel="Сохранить" pending={pending} error={state.error} saved={state.ok} />
    </form>
  );
};

export default MemberProfileForm;
```

`src/components/admin/members/EditProfileDialog.tsx` (full rewrite; the warning step is gone with the notifications):
```tsx
"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";
import MemberProfileForm, { type MemberProfileValues } from "./MemberProfileForm";
import scss from "./EditProfileDialog.module.scss";
import type { FormState } from "@/src/actions/admin/form-state";

interface EditProfileDialogProps {
  memberName: string;
  initial: MemberProfileValues;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}

// Native <dialog> + showModal(): focus stays inside, Esc closes, the
// rest of the page is inert — no hand-rolled focus trap needed.
const EditProfileDialog: FC<EditProfileDialogProps> = ({ memberName, initial, action }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  // Remounting the form on each opening drops stale errors/values.
  const [formKey, setFormKey] = useState(0);

  const show = () => {
    setSaved(false);
    setFormKey((key) => key + 1);
    setOpen(true);
    dialogRef.current?.showModal();
  };

  const close = useCallback(() => dialogRef.current?.close(), []);

  const handleSaved = useCallback(() => {
    setSaved(true);
    close();
  }, [close]);

  // Lock page scroll while the dialog is up.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button type="button" className={scss.trigger} onClick={show}>
        Изменить профиль
      </button>
      {saved && (
        <p className={scss.saved} role="status">
          Профиль сохранён.
        </p>
      )}

      <dialog
        ref={dialogRef}
        className={scss.dialog}
        aria-labelledby="edit-profile-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Click on the backdrop (the dialog element itself) closes it.
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className={scss.formStep}>
          <div className={scss.formStep__head}>
            <h2 id="edit-profile-title" className={scss.title}>
              Профиль: {memberName}
            </h2>
            <button type="button" className={scss.close} onClick={close} aria-label="Закрыть">
              ×
            </button>
          </div>
          <p className={scss.notice}>
            Профиль обычно заполняет сам участник — меняйте его, только если это действительно нужно.
          </p>
          <MemberProfileForm key={formKey} action={action} initial={initial} onSaved={handleSaved} />
        </div>
      </dialog>
    </>
  );
};

export default EditProfileDialog;
```

`src/components/admin/members/MemberProfileView.tsx` (full rewrite, same classes):
```tsx
import { FC, ReactNode } from "react";
import Link from "next/link";
import Avatar from "@/src/ui/Avatar";
import { PROJECT_STATUS_LABELS, positionLabel } from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { splitSkills } from "@/src/server/api/joins";
import type { AdminMemberDetail, ProjectListItem } from "@/src/server/api/schemas";
import scss from "./MemberProfileView.module.scss";

interface MemberProfileViewProps {
  member: AdminMemberDetail;
  projects: ProjectListItem[];
}

// Read-only: the member owns these data. The admin sees what clients see,
// plus the login.
const MemberProfileView: FC<MemberProfileViewProps> = ({ member, projects }) => {
  const name = fullName(member, member.login);
  const position = positionLabel(member.position);
  const skills = splitSkills(member.skills);
  const links = [
    { label: "GitHub", href: member.github },
    { label: "LinkedIn", href: member.linkedin },
    { label: "Портфолио", href: member.portfolio },
    { label: "Резюме (PDF)", href: member.resume },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: "О себе", value: member.bio || <span className={scss.empty}>Не заполнено</span> },
    {
      label: "Навыки",
      value: skills.length ? (
        <ul className={scss.chips}>
          {skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      ) : (
        <span className={scss.empty}>Не указаны</span>
      ),
    },
    {
      label: "Ссылки",
      value: links.length ? (
        <span className={scss.links}>
          {links.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label} ↗
            </a>
          ))}
        </span>
      ) : (
        <span className={scss.empty}>Нет</span>
      ),
    },
    {
      label: "Проекты",
      value: projects.length ? (
        <ul className={scss.list}>
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={`/admin/projects/${project.id}`}>{project.name}</Link>{" "}
              <span>{PROJECT_STATUS_LABELS[project.project_status]}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className={scss.empty}>Пока ни в одном проекте</span>
      ),
    },
  ];

  return (
    <section className={scss.view} aria-label="Профиль участника">
      <div className={scss.head}>
        <span className={scss.photo}>
          <Avatar src={member.avatar} name={name} imageClassName={scss.photo__img} />
        </span>
        <div>
          <p className={scss.name}>{name}</p>
          {position && <p className={scss.position}>{position}</p>}
          <p className={scss.login}>{member.login}</p>
        </div>
      </div>

      <dl className={scss.rows}>
        {rows.map((row) => (
          <div key={row.label} className={scss.row}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default MemberProfileView;
```

`src/components/admin/members/MemberSidebar.tsx` (full rewrite):
```tsx
"use client";

import Select from "@/src/ui/Select";
import { FC, useActionState, useState, useTransition } from "react";
import Link from "next/link";
import ConfirmButton from "@/src/components/admin/ui/ConfirmButton";
import DeleteButton from "@/src/components/admin/ui/DeleteButton";
import Panel from "@/src/components/admin/ui/Panel";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { formatDate } from "@/src/components/admin/labels";
import {
  deleteMemberAction,
  resetPasswordAction,
  setMemberStatusAction,
} from "@/src/actions/admin/members";
import type { FormState } from "@/src/actions/admin/form-state";
import { USER_ROLES, type UserRole, type UserStatus } from "@/src/lib/api-enums";
import { USER_ROLE_LABELS, USER_STATUS_LABELS, USER_STATUS_TONE } from "@/src/lib/api-labels";

interface MemberSidebarProps {
  id: number;
  login: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  roleAction: (prev: FormState, formData: FormData) => Promise<FormState>;
}

const ROLE_OPTIONS = USER_ROLES.map((value) => ({ value, label: USER_ROLE_LABELS[value] }));

const RoleForm: FC<{ role: UserRole; action: MemberSidebarProps["roleAction"] }> = ({ role, action }) => {
  const [state, formAction, pending] = useActionState(action, {});
  const error = pending ? undefined : (state.error ?? state.fieldErrors?.role);
  return (
    <form action={formAction} className={scss.roleForm}>
      <label htmlFor="member-role-select" className={scss.visuallyHidden}>
        Роль
      </label>
      <div className={scss.roleForm__select}>
        <Select
          id="member-role-select"
          name="role"
          defaultValue={role}
          key={JSON.stringify(state)}
          block
          options={ROLE_OPTIONS}
        />
      </div>
      <button type="submit" className={scss.smallButton} disabled={pending}>
        {pending ? "…" : "Сохранить"}
      </button>
      {state.ok && !pending && <span className={scss.saved}>Сохранено</span>}
      {error && (
        <span role="alert" className={scss.field__error}>
          {error}
        </span>
      )}
    </form>
  );
};

const MemberSidebar: FC<MemberSidebarProps> = ({ id, login, status, role, createdAt, roleAction }) => {
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const active = status === "Active";

  const reset = () =>
    startTransition(async () => {
      const result = await resetPasswordAction(id);
      setPassword(result.password ?? null);
      setError(result.error ?? null);
    });

  return (
    <div>
      <Panel title="Роль">
        <RoleForm role={role} action={roleAction} />
      </Panel>

      <Panel title="Статус">
        <p style={{ marginBottom: 12 }}>
          <StatusBadge tone={USER_STATUS_TONE[status]}>{USER_STATUS_LABELS[status]}</StatusBadge>
        </p>
        <ConfirmButton
          label={active ? "Деактивировать" : "Активировать"}
          confirmLabel={active ? "Да, деактивировать" : "Да, активировать"}
          danger={active}
          onConfirm={() => setMemberStatusAction(id, active ? "Inactive" : "Active")}
        />
        {active && (
          <p className={scss.field__hint} style={{ marginTop: 8 }}>
            Неактивный участник скрыт на сайте; история проектов сохраняется.
          </p>
        )}
      </Panel>

      <Panel title="Доступ">
        <dl className={scss.meta}>
          <div>
            <dt>Логин</dt>
            <dd>{login}</dd>
          </div>
          <div>
            <dt>Создан</dt>
            <dd>{formatDate(createdAt)}</dd>
          </div>
        </dl>
        <div style={{ marginTop: 12 }}>
          <button type="button" className={scss.smallButton} onClick={reset} disabled={pending}>
            {pending ? "Сбрасываем…" : "Сбросить пароль"}
          </button>
        </div>
        {password && (
          <p className={scss.notice} style={{ marginTop: 12, marginBottom: 0 }} role="status">
            Новый пароль: <strong>{password}</strong>
            <br />
            Передайте его участнику — повторно он не показывается.
          </p>
        )}
        {error && (
          <p role="alert" className={scss.field__error} style={{ marginTop: 8 }}>
            {error}
          </p>
        )}
      </Panel>

      {active && (
        <Panel>
          <Link href={`/team/${id}`} target="_blank" className={scss.table__link}>
            Открыть публичный профиль ↗
          </Link>
        </Panel>
      )}

      <Panel title="Удаление">
        <DeleteButton
          label="Удалить участника"
          confirmLabel="Да, удалить"
          action={deleteMemberAction.bind(null, id)}
        />
      </Panel>
    </div>
  );
};

export default MemberSidebar;
```

- [ ] **Step 7: Pages**

`app/(admin)/admin/members/page.tsx` (full rewrite):
```tsx
import Select from "@/src/ui/Select";
import Link from "next/link";
import Button from "@/src/ui/Button";
import DataTable from "@/src/components/admin/ui/DataTable";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import PersonCell from "@/src/components/admin/PersonCell";
import MembersUnavailable from "@/src/components/admin/members/MembersUnavailable";
import { USER_ROLES, USER_STATUSES } from "@/src/lib/api-enums";
import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_TONE,
  positionLabel,
} from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { getAdminMembers, loadMembersSection } from "@/src/server/api/admin-members";
import { getMembers } from "@/src/server/api/members";
import { getProjectsWithMembers } from "@/src/server/api/projects";
import type { AdminMemberListItem, MemberListItem } from "@/src/server/api/schemas";
import { requireAdmin } from "@/src/server/auth/dal";

interface Row {
  account: AdminMemberListItem;
  profile: MemberListItem | null;
  projects: number;
}

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

const Page = async ({ searchParams }: PageProps<"/admin/members">) => {
  await requireAdmin();
  const params = await searchParams;
  const q = one(params.q).trim().toLowerCase();
  const role = one(params.role);
  const status = one(params.status);

  const header = (
    <PageHeader
      title="Участники"
      description="Аккаунты создаёт только админ: логин и пароль передаются участнику."
      action={
        <Button href="/admin/members/new" variant="primary">
          Добавить участника
        </Button>
      }
    />
  );

  const [section, roster, projects] = await Promise.all([
    loadMembersSection(getAdminMembers()),
    getMembers(true),
    getProjectsWithMembers(true),
  ]);
  if (section.blocked) {
    return (
      <>
        {header}
        <MembersUnavailable />
      </>
    );
  }

  const profiles = new Map(roster.map((member) => [member.id, member]));
  const projectCounts = new Map<number, number>();
  for (const project of projects) {
    for (const row of project.members) {
      projectCounts.set(row.user, (projectCounts.get(row.user) ?? 0) + 1);
    }
  }

  const rows: Row[] = section.data
    .map((account) => ({
      account,
      profile: profiles.get(account.id) ?? null,
      projects: projectCounts.get(account.id) ?? 0,
    }))
    .filter(({ account, profile }) => {
      const haystack = `${profile ? fullName(profile, "") : ""} ${account.login}`.toLowerCase();
      return (
        (!q || haystack.includes(q)) &&
        (!role || account.role === role) &&
        (!status || account.status === status)
      );
    });

  return (
    <>
      {header}

      <form className={scss.filters} method="get">
        <div className={scss.field}>
          <label htmlFor="filter-q">Поиск</label>
          <input id="filter-q" name="q" defaultValue={q} placeholder="Имя или логин" />
        </div>
        <div className={scss.field}>
          <label htmlFor="filter-role">Роль</label>
          <Select
            id="filter-role"
            name="role"
            defaultValue={role}
            block
            options={[
              { value: "", label: "Все роли" },
              ...USER_ROLES.map((value) => ({ value, label: USER_ROLE_LABELS[value] })),
            ]}
          />
        </div>
        <div className={scss.field}>
          <label htmlFor="filter-status">Статус</label>
          <Select
            id="filter-status"
            name="status"
            defaultValue={status}
            block
            options={[
              { value: "", label: "Все статусы" },
              ...USER_STATUSES.map((value) => ({ value, label: USER_STATUS_LABELS[value] })),
            ]}
          />
        </div>
        <button type="submit" className={scss.smallButton}>
          Применить
        </button>
        {(q || role || status) && (
          <Link href="/admin/members" className={scss.smallButton}>
            Сбросить
          </Link>
        )}
      </form>

      <DataTable<Row>
        rows={rows}
        rowKey={(row) => String(row.account.id)}
        rowHref={(row) => `/admin/members/${row.account.id}`}
        empty="Никого не нашли — измените фильтры."
        rowClassName={(row) => (row.account.status === "Inactive" ? scss.row__muted : undefined)}
        columns={[
          {
            key: "name",
            label: "Участник",
            render: ({ account, profile }) => (
              <PersonCell
                avatar={profile?.avatar ?? null}
                name={profile ? fullName(profile, account.login) : account.login}
                caption={account.login}
              />
            ),
          },
          { key: "role", label: "Роль", render: ({ account }) => USER_ROLE_LABELS[account.role] },
          {
            key: "position",
            label: "Направление",
            render: ({ profile }) => positionLabel(profile?.position ?? null) ?? "—",
          },
          { key: "projects", label: "Проектов", render: (row) => row.projects },
          {
            key: "status",
            label: "Статус",
            render: ({ account }) => (
              <StatusBadge tone={USER_STATUS_TONE[account.status]}>
                {USER_STATUS_LABELS[account.status]}
              </StatusBadge>
            ),
          },
        ]}
      />
    </>
  );
};

export default Page;
```

`app/(admin)/admin/members/new/page.tsx` (full rewrite):
```tsx
import PageHeader from "@/src/components/admin/ui/PageHeader";
import Panel from "@/src/components/admin/ui/Panel";
import MemberCreateForm from "@/src/components/admin/members/MemberCreateForm";
import MembersUnavailable from "@/src/components/admin/members/MembersUnavailable";
import { createMemberAction } from "@/src/actions/admin/members";
import { getAdminMembers, loadMembersSection } from "@/src/server/api/admin-members";
import { requireAdmin } from "@/src/server/auth/dal";

const Page = async () => {
  await requireAdmin();
  const section = await loadMembersSection(getAdminMembers());
  return (
    <>
      <PageHeader title="Новый участник" back={{ href: "/admin/members", label: "Участники" }} />
      {section.blocked ? (
        <MembersUnavailable />
      ) : (
        <Panel>
          <MemberCreateForm action={createMemberAction} />
        </Panel>
      )}
    </>
  );
};

export default Page;
```

`app/(admin)/admin/members/[id]/page.tsx` (full rewrite):
```tsx
import { notFound } from "next/navigation";
import PageHeader from "@/src/components/admin/ui/PageHeader";
import StatusBadge from "@/src/components/admin/ui/StatusBadge";
import MemberProfileView from "@/src/components/admin/members/MemberProfileView";
import MemberSidebar from "@/src/components/admin/members/MemberSidebar";
import EditProfileDialog from "@/src/components/admin/members/EditProfileDialog";
import MembersUnavailable from "@/src/components/admin/members/MembersUnavailable";
import scss from "@/src/components/admin/ui/admin-ui.module.scss";
import { setMemberRoleAction, updateMemberProfileAction } from "@/src/actions/admin/members";
import {
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_STATUS_TONE,
  positionLabel,
} from "@/src/lib/api-labels";
import { fullName } from "@/src/lib/people";
import { parseId } from "@/src/lib/route-id";
import { getAdminMember, loadMembersSection } from "@/src/server/api/admin-members";
import { getMember } from "@/src/server/api/members";
import { requireAdmin } from "@/src/server/auth/dal";

const BACK = { href: "/admin/members", label: "Участники" };

const Page = async ({ params, searchParams }: PageProps<"/admin/members/[id]">) => {
  await requireAdmin();
  const id = parseId((await params).id);
  if (id === null) notFound();
  const { created } = await searchParams;

  // The public profile carries the member's projects; a 404 there just
  // means no public profile.
  const [section, publicProfile] = await Promise.all([
    loadMembersSection(getAdminMember(id)),
    getMember(id, true),
  ]);
  if (section.blocked) {
    return (
      <>
        <PageHeader title="Участник" back={BACK} />
        <MembersUnavailable />
      </>
    );
  }
  const member = section.data;
  if (!member) notFound();

  const name = fullName(member, member.login);

  return (
    <>
      <PageHeader
        title={name}
        back={BACK}
        description={[USER_ROLE_LABELS[member.role], positionLabel(member.position)].filter(Boolean).join(" · ")}
        meta={
          <StatusBadge tone={USER_STATUS_TONE[member.status]}>
            {USER_STATUS_LABELS[member.status]}
          </StatusBadge>
        }
        action={
          <EditProfileDialog
            memberName={name}
            action={updateMemberProfileAction.bind(null, member.id)}
            initial={{
              login: member.login,
              first_name: member.first_name,
              last_name: member.last_name,
              position: member.position ?? "",
              skills: member.skills,
              bio: member.bio,
              github: member.github ?? "",
              linkedin: member.linkedin ?? "",
              portfolio: member.portfolio ?? "",
            }}
          />
        }
      />
      {created && (
        <p className={scss.notice} role="status">
          Участник создан. Передайте ему логин и пароль — пароль больше нигде не показывается.
        </p>
      )}
      <div className={scss.split}>
        <MemberProfileView member={member} projects={publicProfile?.projects ?? []} />
        <MemberSidebar
          id={member.id}
          login={member.login}
          status={member.status}
          role={member.role}
          createdAt={member.created_at}
          roleAction={setMemberRoleAction.bind(null, member.id)}
        />
      </div>
    </>
  );
};

export default Page;
```

- [ ] **Step 8: Tests and the type check**

Run: `bun run test && bunx next typegen && bunx tsc --noEmit`
Expected: PASS, exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/server/api/admin-members.ts src/server/api/admin-members.test.ts src/server/validation/member.ts src/server/validation/member.test.ts src/actions/admin/members.ts src/components/admin/members "app/(admin)/admin/members"
git commit -m "feat: manage member accounts through the api" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: Remove the old store, dead code, and verify everything

**Files:**
- Delete:
  - `src/server/db/`, `src/server/repositories/`, `src/server/queries/public.ts`
  - `src/data/members.ts`, `src/data/projects.ts`, `src/data/teams.ts`, `src/data/stats.ts`, `src/data/specializations.ts`
  - `src/api/index.ts`, `orval.config.ts`, `src/provider/Provider.tsx`
- Modify:
  - `src/server/auth/password.ts`, `src/server/auth/password.test.ts`
  - `src/components/admin/labels.ts`, `src/components/errors/LoadError.tsx`
  - `src/animation/ScrollStack.tsx`
  - `.gitignore`, `package.json`, `bun.lock`

- [ ] **Step 1: Prove nothing new depends on the old modules**

```bash
grep -rn -E '@/src/server/(db|repositories|queries)/|@/src/data/(members|projects|teams|stats|specializations)|@/src/api["/]|@/src/provider/|\b(optionalText|optionalUrl|commaList)\b' src app proxy.ts --include='*.ts' --include='*.tsx' | grep -v -E '^src/server/(db|repositories|queries)/|^src/server/validation/form\.ts'
```
Expected: no output. If something shows up, it was missed in Tasks 10–20; migrate it before deleting anything.

Each of Steps 2–5 commits its own change. `git rm` stages deletions immediately, so commit before starting the next step; otherwise one commit swallows the next one's changes.

- [ ] **Step 2: Delete the store and the mocks**

```bash
git rm -r src/server/db src/server/repositories src/server/queries
git rm src/data/members.ts src/data/projects.ts src/data/teams.ts src/data/stats.ts src/data/specializations.ts
```

`src/server/auth/password.ts` (full rewrite; hashing now lives in the backend):
```ts
import "server-only";
import { randomInt } from "node:crypto";

// No look-alike characters (0/O, 1/l/I) — admins read these out to people.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generatePassword(): string {
  return Array.from({ length: 14 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}
```

`src/server/auth/password.test.ts` (full rewrite):
```ts
import { describe, expect, it } from "vitest";
import { generatePassword } from "./password";

describe("generatePassword", () => {
  it("makes 14 characters without look-alikes", () => {
    const password = generatePassword();
    expect(password).toHaveLength(14);
    expect(password).not.toMatch(/[01OlI]/);
  });

  it("differs between calls", () => {
    expect(generatePassword()).not.toBe(generatePassword());
  });
});
```

`src/components/admin/labels.ts` (full rewrite; enum labels moved to `src/lib/api-labels.ts`):
```ts
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
```

`src/components/errors/LoadError.tsx`: replace the paragraph text with
```tsx
      Сервер не отвечает. Попробуйте ещё раз через минуту.
```

`src/server/validation/form.ts`: delete `optionalText`, `optionalUrl` and `commaList`. Tasks 16, 19 and 20 removed their last users, and Step 1 proved it. Keep `FieldErrors`, `ParseResult`, `requiredText`, `nullableUrl` and `parseForm`.

Run: `bun run test && bunx tsc --noEmit`
Expected: PASS, exit 0.

```bash
git add src/server/auth/password.ts src/server/auth/password.test.ts src/components/admin/labels.ts src/components/errors/LoadError.tsx src/server/validation/form.ts
git commit -m "refactor: remove the local json store and mock data" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Drop the unused client scaffolding**

```bash
git rm src/api/index.ts orval.config.ts src/provider/Provider.tsx
bun remove @tanstack/react-query @tanstack/react-query-devtools @tanstack/react-devtools tanstack-query orval
```
Expected: `package.json` and `bun.lock` updated, install succeeds.

Run: `bunx tsc --noEmit`
Expected: exit 0.

```bash
git add package.json bun.lock
git commit -m "chore: drop unused react-query, axios and orval scaffolding" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Fix the last lint error**

`src/animation/ScrollStack.tsx` line 54. Type the cache instead of `any`:
```tsx
  const lastTransformsRef = useRef(
    new Map<number, { translateY: number; scale: number; rotation: number; blur: number }>(),
  );
```

Run: `bun run lint`
Expected: 0 errors (the existing `<img>` warnings are fine).

```bash
git add src/animation/ScrollStack.tsx
git commit -m "fix: type the scroll stack transform cache" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: `.gitignore` and local files**

Run: `ls data 2>/dev/null`.
- If it prints something, the old `data/db.json` store is still on disk. **Stop and ask the user** whether it can be deleted. Remove the `# local JSON store (admin data)` and `/data/` lines from `.gitignore` only after it's gone; otherwise leave them and skip the commit.
- If it prints nothing, remove those two lines now.

```bash
git add .gitignore
git commit -m "chore: stop ignoring the removed data folder" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Also tell the user that `ADMIN_LOGIN` and `ADMIN_PASSWORD` in `.env` are no longer read and can be deleted. Don't edit the secrets yourself.

- [ ] **Step 6: Full verification**

```bash
bun run test
bun run lint
bunx next typegen && bunx tsc --noEmit
bun run build
```
Expected:
- tests PASS;
- lint has 0 errors (the existing `<img>` warnings are fine);
- tsc exits 0;
- the build succeeds without contacting the API (public routes are request-time rendered).

Then run `bun run start` in the background and check:
```bash
for path in / /projects /projects/1 /team /team/2 /about /contact /login; do
  printf '%-12s ' "$path"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000$path"
done
for path in /projects/abc /projects/999999 /team/9999; do
  printf '%-16s ' "$path"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000$path"
done
curl -s -o /dev/null -w '/admin   %{http_code} %{redirect_url}\n' http://localhost:3000/admin
curl -s -o /dev/null -w '/account %{http_code} %{redirect_url}\n' http://localhost:3000/account
curl -s http://localhost:3000/team/2 | grep -o 'Нурлан Асанов' | head -1
```
Expected:
- all public paths `200`; the three bad ids `404`;
- `/admin` and `/account` `307` to `/login`;
- the name is printed.

Stop the server.

In a browser, check:
- `/contact` with an empty submit shows field errors;
- `/`, `/projects`, `/projects/1`, `/team`, `/team/2` look right at 375px and at desktop width.

- [ ] **Step 7: Hand-off notes for the user**

Report:
- what was verified live (public pages) and what wasn't (login and admin: no test accounts);
- the manual checklist from spec §7;
- that `Specializations.tsx` was dead code and was removed, not ported;
- that `docs/backend-issues.md` items #1 (`/admin/members/` redirect) and #2 (test accounts) block the members section and the live auth check.

