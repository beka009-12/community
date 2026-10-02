# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin logs in with `.env` credentials and manages members, teams, projects and client requests stored in a JSON file; the public site reads the same data.

**Architecture:** Server-only layers under `src/server/`: a JSON store (`data/db.json`, serialized atomic writes, seeded from current mocks) → repositories (domain functions) → Server Actions (zod-validated, guarded by `requireAdmin()`). Auth is an HMAC-signed httpOnly cookie made with Web Crypto; `proxy.ts` does the optimistic redirect. Admin UI lives in `app/(admin)/admin`; public pages switch from `src/data/*` imports to `src/server/queries/public.ts`.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript strict, SCSS modules, zod, vitest (new, server-logic unit tests), Playwright (ad-hoc e2e script in scratchpad).

**Spec:** `docs/superpowers/specs/2026-10-02-admin-dashboard-design.md`

## Global Constraints

- No `any`; interfaces/types for every props object, action state and repository return.
- `async/await` only, no `.then()` chains.
- New file names: follow the repo — components `PascalCase.tsx`, everything else `kebab-case.ts`.
- Secrets only from env: `ADMIN_LOGIN`, `ADMIN_PASSWORD`, `AUTH_SECRET`. Never log them.
- Session cookie name `mc_session`, TTL 8h, `httpOnly`, `sameSite: "lax"`, `secure` when `NODE_ENV === "production"`.
- Store file: `process.env.DB_FILE ?? path.join(process.cwd(), "data", "db.json")`; `data/` is gitignored.
- Members are never physically deleted — only `status: "INACTIVE"`.
- User-facing copy in Russian; commits in English, Conventional Commits, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Every admin page and admin Server Action calls `requireAdmin()` first.
- Before writing Next-specific code (cookies, proxy, redirect, revalidatePath, useActionState) check `node_modules/next/dist/docs/` — this Next version differs from training data.

## Review Focus

1. **Duplicate login** on member create/edit → field error «Логин уже занят», nothing written. (Task 5 test)
2. **Tampered or expired cookie** (signature edited, `exp` in the past) → treated as logged out, never as admin. (Task 3 test)
3. **Concurrent writes** (two actions at once) → both changes persist, file stays valid JSON. (Task 2 test)
4. **Corrupt/missing `db.json`** → missing: seeded; corrupt: `StoreError` logged, admin sees generic error instead of a crash, file not overwritten. (Task 2 test)
5. **Adding the same user twice to a team/project** → second add updates the role instead of creating a duplicate row. (Task 5 test)

---

## File Structure

```
proxy.ts                                   optimistic auth redirect
vitest.config.ts                           unit test config
src/server/db/types.ts                     DB entity types
src/server/db/seed.ts                      seed DB from src/data mocks
src/server/db/store.ts                     readDb / mutateDb (queue + atomic write)
src/server/db/store.test.ts
src/server/auth/password.ts                scrypt hash / verify / generate
src/server/auth/session-token.ts           sign / verify token (pure, Web Crypto)
src/server/auth/session-token.test.ts
src/server/auth/password.test.ts
src/server/auth/session.ts                 cookie create / read / delete
src/server/auth/dal.ts                     requireAdmin()
src/server/repositories/members.ts         + members.test.ts
src/server/repositories/teams.ts           + teams.test.ts
src/server/repositories/projects.ts        + projects.test.ts
src/server/repositories/requests.ts        + requests.test.ts
src/server/queries/public.ts               view models for public pages
src/server/validation/*.ts                 zod schemas per entity
src/actions/auth.ts                        login / logout (rewrite)
src/actions/client-requests.ts             public createClientRequest
src/actions/admin/{members,teams,projects,requests}.ts
app/(admin)/admin/layout.tsx + pages       admin routes
src/components/admin/*                     admin UI (shell, table, fields, forms)
```

---

### Task 1: Tooling

**Files:**
- Modify: `package.json` (deps), `.gitignore`
- Create: `vitest.config.ts`

**Interfaces:** Produces `bun run test` (vitest run).

- [ ] **Step 1: Install deps**

Run: `bun add zod && bun add -d vitest`

- [ ] **Step 2: Add test script and config**

In `package.json` scripts add `"test": "vitest run"`. Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 3: Ignore the store**

Append to `.gitignore`:

```
# local JSON store (admin data)
/data/
```

- [ ] **Step 4: Verify** — `bun run test` → "No test files found" (exit 1 is fine at this point); `bun run build` passes.

- [ ] **Step 5: Commit** — `chore: add zod and vitest`

---

### Task 2: DB types, seed and store

**Files:** Create `src/server/db/{types,seed,store}.ts`, `src/server/db/store.test.ts`

**Interfaces:**
- Produces:
  - types `Role = "ADMIN" | "TEAM_LEAD" | "DEVELOPER"`, `MembershipRole = "TEAM_LEAD" | "DEVELOPER"`, `UserStatus = "ACTIVE" | "INACTIVE"`, `RequestStatus = "NEW" | "REVIEWING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED"`, `DbUser`, `DbProfile`, `DbTeam`, `DbTeamMember`, `DbProject`, `DbProjectMember`, `DbClientRequest`, `Db`
  - `readDb(): Promise<Db>`, `mutateDb<T>(fn: (db: Db) => T): Promise<T>`, `class StoreError extends Error`
  - `buildSeed(): Promise<Db>`

- [ ] **Step 1: Types** — `src/server/db/types.ts`

```ts
import type { ProjectCategory, ProjectOrigin, ProjectStatus } from "@/src/data/projects";
import type { EducationEntry, ExperienceEntry } from "@/src/data/members";

export type Role = "ADMIN" | "TEAM_LEAD" | "DEVELOPER";
export type MembershipRole = "TEAM_LEAD" | "DEVELOPER";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type RequestStatus =
  | "NEW" | "REVIEWING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

export interface DbUser {
  id: string;
  login: string;
  passwordHash: string;
  role: Exclude<Role, "ADMIN">;
  status: UserStatus;
  createdAt: string;
}

export interface DbProfile {
  userId: string;
  firstName: string;
  lastName: string;
  photo: string;
  bio: string;
  specializationId: string;
  roleTitle: string;
  stack: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  resume?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
}

export interface DbTeam { id: string; name: string; description: string; createdAt: string }
export interface DbTeamMember { teamId: string; userId: string; role: MembershipRole }

export interface DbProject {
  id: string; // slug
  name: string;
  description: string;
  details: string;
  status: ProjectStatus;
  category: ProjectCategory;
  origin: ProjectOrigin;
  year: string;
  image: string;
  stack: string[];
  demoUrl?: string;
  githubUrl?: string;
  featured: boolean;
  createdAt: string;
}
export interface DbProjectMember { projectId: string; userId: string; role: MembershipRole }

export interface DbClientRequest {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  title: string;
  description: string;
  projectType?: ProjectCategory;
  budget?: string;
  status: RequestStatus;
  createdAt: string;
}

export interface Db {
  users: DbUser[];
  profiles: DbProfile[];
  teams: DbTeam[];
  teamMembers: DbTeamMember[];
  projects: DbProject[];
  projectMembers: DbProjectMember[];
  clientRequests: DbClientRequest[];
}
```

- [ ] **Step 2: Seed** — `src/server/db/seed.ts` (uses `hashPassword` from Task 3; implement Task 3 Step 3 first if executing out of order)

```ts
import { randomBytes } from "node:crypto";
import { MEMBERS, isTeamLead } from "@/src/data/members";
import { PROJECTS } from "@/src/data/projects";
import { TEAMS } from "@/src/data/teams";
import { hashPassword } from "@/src/server/auth/password";
import type { Db } from "./types";

// Mock members get unusable random passwords — the admin resets one
// before anyone can log in as that member.
export async function buildSeed(): Promise<Db> {
  const now = new Date().toISOString();
  const users = await Promise.all(
    MEMBERS.map(async (member) => ({
      id: member.id,
      login: member.id,
      passwordHash: await hashPassword(randomBytes(24).toString("base64url")),
      role: isTeamLead(member) ? ("TEAM_LEAD" as const) : ("DEVELOPER" as const),
      status: member.status,
      createdAt: now,
    })),
  );
  const profiles = MEMBERS.map((member) => ({
    userId: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    photo: member.photo,
    bio: member.bio,
    specializationId: member.specializationId,
    roleTitle: member.role,
    stack: member.stack,
    skills: member.skills,
    github: member.github,
    linkedin: member.linkedin,
    portfolio: member.portfolio,
    resume: member.resume,
    experience: member.experience,
    education: member.education,
  }));
  const teams = TEAMS.map((team) => ({
    id: team.id,
    name: `Команда ${team.projectName}`,
    description: "",
    createdAt: now,
  }));
  const memberRole = (id: string) =>
    MEMBERS.find((member) => member.id === id && isTeamLead(member)) ? "TEAM_LEAD" as const : "DEVELOPER" as const;
  const teamMembers = TEAMS.flatMap((team) =>
    team.memberIds.map((userId) => ({ teamId: team.id, userId, role: memberRole(userId) })),
  );
  const projectMembers = TEAMS.flatMap((team) =>
    team.memberIds.map((userId) => ({ projectId: team.projectSlug, userId, role: memberRole(userId) })),
  );
  const projects = PROJECTS.map((project) => ({
    id: project.slug,
    name: project.name,
    description: project.description,
    details: project.details,
    status: project.status,
    category: project.category,
    origin: project.origin,
    year: project.year,
    image: project.image,
    stack: project.stack,
    demoUrl: project.demoUrl,
    githubUrl: project.githubUrl,
    featured: project.featured,
    createdAt: now,
  }));
  return { users, profiles, teams, teamMembers, projects, projectMembers, clientRequests: [] };
}
```

- [ ] **Step 3: Failing store tests** — `src/server/db/store.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "mc-db-"));
  process.env.DB_FILE = path.join(dir, "db.json");
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const load = async () => import(`./store?t=${Date.now()}`) as Promise<typeof import("./store")>;

describe("store", () => {
  it("seeds a missing file", async () => {
    const { readDb } = await load();
    const db = await readDb();
    expect(db.users.length).toBeGreaterThan(0);
    expect(JSON.parse(await readFile(process.env.DB_FILE!, "utf8")).users.length).toBe(db.users.length);
  });

  it("keeps both of two concurrent writes", async () => {
    const { mutateDb, readDb } = await load();
    await readDb();
    await Promise.all([
      mutateDb((db) => { db.teams.push({ id: "a", name: "A", description: "", createdAt: "" }); }),
      mutateDb((db) => { db.teams.push({ id: "b", name: "B", description: "", createdAt: "" }); }),
    ]);
    const ids = (await readDb()).teams.map((team) => team.id);
    expect(ids).toEqual(expect.arrayContaining(["a", "b"]));
  });

  it("throws StoreError on corrupt JSON and leaves the file alone", async () => {
    await writeFile(process.env.DB_FILE!, "{not json", "utf8");
    const { readDb, StoreError } = await load();
    await expect(readDb()).rejects.toBeInstanceOf(StoreError);
    expect(await readFile(process.env.DB_FILE!, "utf8")).toBe("{not json");
  });
});
```

- [ ] **Step 4: Run** `bun run test src/server/db` → FAIL (module not found).

- [ ] **Step 5: Implement** — `src/server/db/store.ts`

```ts
import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildSeed } from "./seed";
import type { Db } from "./types";

export class StoreError extends Error {}

const dbFile = () => process.env.DB_FILE ?? path.join(process.cwd(), "data", "db.json");

let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Db> {
  let raw: string;
  try {
    raw = await readFile(dbFile(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw new StoreError("Cannot read store", { cause: error });
    }
    const seed = await buildSeed();
    await save(seed);
    return seed;
  }
  try {
    return JSON.parse(raw) as Db;
  } catch (error) {
    throw new StoreError("Store file is not valid JSON", { cause: error });
  }
}

async function save(db: Db): Promise<void> {
  const file = dbFile();
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await rename(tmp, file);
}

// Reads and writes go through one queue so a read never sees a
// half-applied mutation and two mutations never clobber each other.
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export const readDb = (): Promise<Db> => enqueue(load);

export const mutateDb = <T>(fn: (db: Db) => T): Promise<T> =>
  enqueue(async () => {
    const db = await load();
    const result = fn(db);
    await save(db);
    return result;
  });
```

Note: `server-only` breaks vitest imports — add `server-only` to vitest `resolve.alias` as an empty module: in `vitest.config.ts` alias `"server-only": path.resolve(__dirname, "vitest.server-only.ts")` and create `vitest.server-only.ts` with `export {};`.

- [ ] **Step 6: Run** `bun run test src/server/db` → PASS (3 tests).

- [ ] **Step 7: Commit** — `feat: add json store with seed for admin data`

---

### Task 3: Passwords and session token

**Files:** Create `src/server/auth/{password,session-token}.ts` + `.test.ts` each.

**Interfaces:**
- Produces:
  - `hashPassword(plain: string): Promise<string>` (`"salt:hash"` hex), `verifyPassword(plain: string, stored: string): Promise<boolean>`, `generatePassword(): string` (14 chars, letters+digits)
  - `interface SessionPayload { sub: string; role: Role; exp: number }` (exp = epoch ms)
  - `signToken(payload: SessionPayload, secret: string): Promise<string>`, `verifyToken(token: string | undefined, secret: string, now?: number): Promise<SessionPayload | null>`

- [ ] **Step 1: Failing tests**

`password.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { generatePassword, hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("s3cret-pass");
    expect(await verifyPassword("s3cret-pass", hash)).toBe(true);
    expect(await verifyPassword("other", hash)).toBe(false);
  });
  it("rejects a malformed stored hash", async () => {
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
  it("generates 14-char alphanumeric passwords", () => {
    expect(generatePassword()).toMatch(/^[A-Za-z0-9]{14}$/);
  });
});
```

`session-token.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "./session-token";

const secret = "test-secret-test-secret-test-secret";
const payload = { sub: "admin", role: "ADMIN" as const, exp: 2_000 };

describe("session token", () => {
  it("round-trips a valid token", async () => {
    const token = await signToken(payload, secret);
    expect(await verifyToken(token, secret, 1_000)).toEqual(payload);
  });
  it("rejects an expired token", async () => {
    expect(await verifyToken(await signToken(payload, secret), secret, 3_000)).toBeNull();
  });
  it("rejects a tampered payload", async () => {
    const [, sig] = (await signToken(payload, secret)).split(".");
    const forged = Buffer.from(JSON.stringify({ ...payload, exp: 9e15 })).toString("base64url");
    expect(await verifyToken(`${forged}.${sig}`, secret, 1_000)).toBeNull();
  });
  it("rejects a token signed with another secret, garbage and undefined", async () => {
    expect(await verifyToken(await signToken(payload, "other-secret-other-secret"), secret, 1_000)).toBeNull();
    expect(await verifyToken("abc", secret, 1_000)).toBeNull();
    expect(await verifyToken(undefined, secret, 1_000)).toBeNull();
  });
});
```

- [ ] **Step 2: Run** `bun run test src/server/auth` → FAIL.

- [ ] **Step 3: Implement `password.ts`**

```ts
import { randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const KEY_LENGTH = 64;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(plain, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await scryptAsync(plain, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  return timingSafeEqual(actual, expected);
}

export function generatePassword(): string {
  return Array.from({ length: 14 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}
```

- [ ] **Step 4: Implement `session-token.ts`** (Web Crypto only — imported by `proxy.ts`)

```ts
import type { Role } from "@/src/server/db/types";

export interface SessionPayload {
  sub: string;
  role: Role;
  exp: number;
}

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value: string) =>
  Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));

const importKey = (secret: string) =>
  crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

export async function signToken(payload: SessionPayload, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyToken(
  token: string | undefined,
  secret: string,
  now: number = Date.now(),
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC", await importKey(secret), fromBase64Url(signature), encoder.encode(body),
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    return typeof payload.exp === "number" && payload.exp > now ? payload : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Run** `bun run test src/server/auth` → PASS (7 tests). Then `bun run test` → all PASS.

- [ ] **Step 6: Commit** — `feat: add password hashing and signed session tokens`

---

### Task 4: Admin login, logout, DAL and proxy

**Files:**
- Create: `src/server/auth/session.ts`, `src/server/auth/dal.ts`, `proxy.ts`
- Modify: `src/actions/auth.ts` (replace stub), `src/components/login-sections/LoginForm.tsx` (submit text only if needed)

**Interfaces:**
- Consumes: `signToken`, `verifyToken`, `SessionPayload` (Task 3)
- Produces: `SESSION_COOKIE = "mc_session"`, `createSession(payload: Omit<SessionPayload,"exp">): Promise<void>`, `readSession(): Promise<SessionPayload | null>`, `deleteSession(): Promise<void>`, `requireAdmin(): Promise<SessionPayload>`, actions `login(prev: LoginState, fd: FormData): Promise<LoginState>` (same `LoginState` shape as today), `logout(): Promise<void>`

- [ ] **Step 1: `session.ts`** — read `node_modules/next/dist/docs/01-app/02-guides/authentication.md` (cookies section) first.

```ts
import "server-only";
import { cookies } from "next/headers";
import { signToken, verifyToken, type SessionPayload } from "./session-token";

export const SESSION_COOKIE = "mc_session";
const TTL_MS = 8 * 60 * 60 * 1000;

const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return value;
};

export async function createSession(payload: Omit<SessionPayload, "exp">): Promise<void> {
  const exp = Date.now() + TTL_MS;
  const token = await signToken({ ...payload, exp }, secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(exp),
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  return verifyToken((await cookies()).get(SESSION_COOKIE)?.value, secret());
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
```

- [ ] **Step 2: `dal.ts`**

```ts
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./session";

export const requireAdmin = cache(async () => {
  const session = await readSession();
  if (!session || session.role !== "ADMIN") redirect("/login");
  return session;
});
```

- [ ] **Step 3: Rewrite `src/actions/auth.ts`** — keep `LoginState`, `LoginFieldErrors` exports and field validation messages; replace the stub tail:

```ts
// after field validation succeeds:
const adminLogin = process.env.ADMIN_LOGIN;
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminLogin || !adminPassword) {
  console.error("ADMIN_LOGIN / ADMIN_PASSWORD are not set");
  return { error: "Вход временно недоступен.", login: loginValue };
}
const ok = safeEqual(loginValue, adminLogin) && safeEqual(rawPassword, adminPassword);
if (!ok) return { error: "Неверный логин или пароль.", login: loginValue };
await createSession({ sub: "admin", role: "ADMIN" });
redirect("/admin");
```

with

```ts
import { createHash, timingSafeEqual } from "node:crypto";
const digest = (value: string) => createHash("sha256").update(value).digest();
const safeEqual = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
```

Remove the 600 ms stub delay and its TODO.

- [ ] **Step 4: `proxy.ts`** (root) — read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` first.

```ts
import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/src/server/auth/session-token";

const SESSION_COOKIE = "mc_session";

// Optimistic check only — requireAdmin() in pages/actions is the real guard.
export async function proxy(request: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? "";
  const session = await verifyToken(request.cookies.get(SESSION_COOKIE)?.value, secret);
  const isAdmin = session?.role === "ADMIN";
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && isAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/login"] };
```

- [ ] **Step 5: Temporary `/admin` page** so redirect target exists: `app/(admin)/admin/page.tsx` calling `await requireAdmin()` and rendering `<h1>Админка</h1>` (replaced in Task 7).

- [ ] **Step 6: Verify manually with Playwright** — scratchpad script: GET `/admin` → lands on `/login`; wrong password → «Неверный логин или пароль.»; correct (read from `.env` inside the script, don't print) → URL `/admin`; GET `/login` while logged in → `/admin`. `bun run build` passes.

- [ ] **Step 7: Commit** — `feat: add admin login with signed session cookie`

---

### Task 5: Repositories

**Files:** Create `src/server/repositories/{members,teams,projects,requests}.ts` + `members.test.ts`, `memberships.test.ts`, `requests.test.ts`; `src/server/repositories/errors.ts`

**Interfaces:**
- Consumes: `readDb`, `mutateDb`, types (Task 2); `hashPassword` (Task 3)
- Produces:

```ts
// errors.ts
export class NotFoundError extends Error {}
export class ConflictError extends Error { constructor(public field: string, message: string) { super(message); } }

// members.ts
export interface AdminMember { user: DbUser; profile: DbProfile }
export interface MemberInput { login: string; role: "TEAM_LEAD" | "DEVELOPER"; firstName: string; lastName: string;
  specializationId: string; roleTitle: string; stack: string; bio: string; skills: string[];
  github?: string; linkedin?: string; portfolio?: string; photo?: string }
listMembers(): Promise<AdminMember[]>
getMember(id: string): Promise<AdminMember | null>
createMember(input: MemberInput & { password: string }): Promise<AdminMember>   // ConflictError("login") if taken
updateMember(id: string, input: MemberInput): Promise<AdminMember>              // ConflictError("login"), NotFoundError
setMemberStatus(id: string, status: UserStatus): Promise<void>
resetMemberPassword(id: string, password: string): Promise<void>

// teams.ts
listTeams(): Promise<Array<DbTeam & { memberCount: number }>>
getTeam(id: string): Promise<{ team: DbTeam; members: Array<AdminMember & { membershipRole: MembershipRole }> } | null>
createTeam(input: { name: string; description: string }): Promise<DbTeam>
updateTeam(id: string, input: { name: string; description: string }): Promise<DbTeam>
upsertTeamMember(teamId: string, userId: string, role: MembershipRole): Promise<void>  // updates role if present
removeTeamMember(teamId: string, userId: string): Promise<void>

// projects.ts
export type ProjectInput = Omit<DbProject, "createdAt">;
listProjects(): Promise<Array<DbProject & { memberCount: number }>>
getProject(id: string): Promise<{ project: DbProject; members: Array<AdminMember & { membershipRole: MembershipRole }> } | null>
createProject(input: ProjectInput): Promise<DbProject>      // ConflictError("id") if slug taken
updateProject(id: string, input: Omit<ProjectInput, "id">): Promise<DbProject>
upsertProjectMember(projectId: string, userId: string, role: MembershipRole): Promise<void>
removeProjectMember(projectId: string, userId: string): Promise<void>

// requests.ts
export type ClientRequestInput = Omit<DbClientRequest, "id" | "status" | "createdAt">;
createClientRequest(input: ClientRequestInput): Promise<DbClientRequest>
listClientRequests(status?: RequestStatus): Promise<DbClientRequest[]>   // newest first
getClientRequest(id: string): Promise<DbClientRequest | null>
setClientRequestStatus(id: string, status: RequestStatus): Promise<void>
```

IDs: members — `login` lowercased (stable, URL-safe; validated in Task 8 as `/^[a-z0-9._-]{3,32}$/`); teams/requests — `crypto.randomUUID()`; projects — slug from input. Logins compared case-insensitively. Upsert functions throw `NotFoundError` if team/project or user doesn't exist.

- [ ] **Step 1: Failing tests** (same tmp `DB_FILE` setup as Task 2; import modules after setting env)

`members.test.ts`:
```ts
it("creates a member with hashed password", async () => {
  const { createMember, getMember } = await import("./members");
  const created = await createMember({ ...input, login: "new.dev", password: "pw-123456" });
  expect(created.user.passwordHash).not.toContain("pw-123456");
  expect((await getMember("new.dev"))?.profile.firstName).toBe("Тест");
});
it("rejects a duplicate login case-insensitively and writes nothing", async () => {
  const { createMember, listMembers } = await import("./members");
  const before = (await listMembers()).length;
  await expect(createMember({ ...input, login: "FRONTEND-LEAD", password: "pw-123456" }))
    .rejects.toMatchObject({ field: "login" });
  expect((await listMembers()).length).toBe(before);
});
```
with `const input = { role: "DEVELOPER" as const, firstName: "Тест", lastName: "Тестов", specializationId: "frontend", roleTitle: "Frontend-разработчик", stack: "React", bio: "", skills: [] };`

`memberships.test.ts`:
```ts
it("adding the same user twice updates the role instead of duplicating", async () => {
  const { upsertProjectMember, getProject } = await import("./projects");
  await upsertProjectMember("amanat", "qa-dev", "DEVELOPER");
  await upsertProjectMember("amanat", "qa-dev", "TEAM_LEAD");
  const rows = (await getProject("amanat"))!.members.filter((m) => m.user.id === "qa-dev");
  expect(rows).toHaveLength(1);
  expect(rows[0].membershipRole).toBe("TEAM_LEAD");
});
it("throws NotFoundError for an unknown user", async () => {
  const { upsertTeamMember } = await import("./teams");
  await expect(upsertTeamMember("amanat", "nobody", "DEVELOPER")).rejects.toBeInstanceOf(NotFoundError);
});
```

`requests.test.ts`:
```ts
it("creates NEW requests and lists newest first, filtered by status", async () => {
  const { createClientRequest, listClientRequests, setClientRequestStatus } = await import("./requests");
  const a = await createClientRequest({ name: "A", email: "a@a.kg", title: "A", description: "d" });
  const b = await createClientRequest({ name: "B", email: "b@b.kg", title: "B", description: "d" });
  expect((await listClientRequests()).map((r) => r.id)).toEqual([b.id, a.id]);
  await setClientRequestStatus(a.id, "REVIEWING");
  expect((await listClientRequests("NEW")).map((r) => r.id)).toEqual([b.id]);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3:** implement the four modules with `mutateDb`/`readDb` per the interfaces above (each mutation does all checks inside the `mutateDb` callback so check+write is atomic). **Step 4: Run** `bun run test` → PASS.

- [ ] **Step 5: Commit** — `feat: add repositories for members, teams, projects and requests`

---

### Task 6: Public site reads the store; contact form creates requests

**Files:**
- Create: `src/server/queries/public.ts`, `src/server/validation/client-request.ts`, `src/actions/client-requests.ts`
- Modify: `app/(site)/team/page.tsx`, `app/(site)/team/[id]/page.tsx`, `app/(site)/projects/page.tsx`, `app/(site)/projects/[slug]/page.tsx`, `app/(site)/(home)/page.tsx`, `app/(site)/about/page.tsx`; components `Team.tsx`, `team-sections/{Roster,Teams}.tsx`, `Projects.tsx`, `projects-sections/ProjectDetail.tsx`, `hero-sections/Portfolio.tsx`, `about-sections/Services.tsx`, `About.tsx`, `Hero.tsx`, `MemberProfile.tsx`, `contact-sections/RequestForm.tsx`

**Interfaces:**
- Consumes: repositories (Task 5)
- Produces (`public.ts`, all return the existing UI shapes so components barely change):
  - `getPublicMembers(): Promise<Member[]>` (ACTIVE only; `Member` from `src/data/members` built from user+profile)
  - `getPublicMember(id): Promise<Member | null>`
  - `getPublicProjects(): Promise<Project[]>` (`Project` from `src/data/projects`, `slug = id`)
  - `getPublicProject(slug): Promise<Project | null>`
  - `getProjectMembersPublic(slug): Promise<Member[]>` (ACTIVE only)
  - `getMemberProjectsPublic(memberId): Promise<MemberProject[]>` (role from ProjectMember)
  - `getProjectTeams(): Promise<Array<{ projectSlug: string; projectName: string; members: Member[] }>>`
  - action `createClientRequest(prev: RequestFormState, fd: FormData): Promise<RequestFormState>` with `interface RequestFormState { ok?: boolean; error?: string; fieldErrors?: Partial<Record<"name"|"email"|"title"|"description"|"phone"|"budget", string>> }`

- [ ] **Step 1:** Implement `public.ts`. Move `MemberProject` / `ProjectRole` types to `public.ts` (re-export from `src/data/teams.ts` for now is not needed — update imports in `ProjectPath.tsx`, `ProfileCard.tsx`).
- [ ] **Step 2:** Client components stop importing data: `Roster`, `Projects`, `Services`, `Portfolio` receive arrays via props from their server parents. Server components (`Teams`, `ProjectDetail`, `MemberProfile`) receive data via props from pages.
- [ ] **Step 3:** Pages fetch via `public.ts`; remove `generateStaticParams` from `team/[id]` and `projects/[slug]` (dynamic now); `notFound()` when null. `getAdjacentProjects` logic moves into the project page using `getPublicProjects()`.
- [ ] **Step 4:** zod schema `clientRequestSchema` (name 2–80, email valid, title 2–120, description 10–2000, company/phone/budget optional ≤ 120, projectType optional enum of `ProjectCategory`); action validates, calls `createClientRequest` in try/catch, returns `{ ok: true }` or errors. `RequestForm` switches to `useActionState`, shows field errors under inputs (`aria-invalid`, `aria-describedby`), keeps the existing success state when `ok`.
- [ ] **Step 5: Verify** — `bun run build`; Playwright: `/team`, a profile, `/projects`, a project page render as before; submitting `/contact` with an invalid email shows a field error; a valid submit shows «Заявка отправлена» and adds a row to `data/db.json`.
- [ ] **Step 6: Commit** — `feat: serve public pages from the json store`

---

### Task 7: Admin shell and overview

**Files:**
- Create: `app/(admin)/layout.tsx` (html-less group layout → just `<main>` wrapper like `(auth)`), `app/(admin)/admin/layout.tsx`, `app/(admin)/admin/page.tsx` (replace temp), `app/(admin)/admin/settings/page.tsx`, `src/components/admin/AdminShell.tsx` (+ scss), `src/components/admin/AdminNav.tsx` (client: active link via `usePathname`, mobile toggle), `src/components/admin/ui/{PageHeader,DataTable,StatusBadge,Field,FormActions,ConfirmButton,EmptyState}.tsx` + `admin-ui.module.scss`

**Interfaces:**
- Consumes: `requireAdmin`, `logout`, repositories list functions
- Produces UI kit used by Tasks 8–11:
  - `PageHeader({ title, action?: ReactNode })`
  - `DataTable<T>({ rows: T[], columns: Array<{ key: string; label: string; render: (row: T) => ReactNode }>, rowHref?: (row: T) => string, empty: string })`
  - `StatusBadge({ tone: "positive"|"accent"|"neutral"|"muted"|"danger", children })`
  - `Field({ label, name, error?, children })` — renders label + child control + error with ids wired
  - `FormActions({ submitLabel, pending })`
  - `ConfirmButton({ action: () => Promise<void>, label, confirmLabel })` — two-step inline confirm (first click shows «Точно?» + confirm/cancel)

- [ ] **Step 1:** Layout: `requireAdmin()` in `app/(admin)/admin/layout.tsx`; `AdminShell` = grid `[240px sidebar][content]`, sidebar has logo, nav (Обзор `/admin`, Участники, Команды, Проекты, Заявки, Настройки), and a `<form action={logout}>` «Выйти» button at the bottom; < 960px → top bar + toggle.
- [ ] **Step 2:** Overview page: `requireAdmin()`; cards with counts (active/inactive members, teams, projects by status, NEW requests) and a table of the 5 latest NEW requests linking to `/admin/requests/[id]`.
- [ ] **Step 3:** Settings page: `PageHeader` + `EmptyState` «Настройки появятся позже».
- [ ] **Step 4: Verify** — build; Playwright screenshot `/admin` at 1440 and 390 after login.
- [ ] **Step 5: Commit** — `feat: add admin shell and overview`

---

### Task 8: Members admin

**Files:** Create `src/server/validation/member.ts`, `src/actions/admin/members.ts`, `app/(admin)/admin/members/{page,new/page,[id]/page}.tsx`, `src/components/admin/members/{MemberForm,MembersFilters,PasswordReset}.tsx`

**Interfaces:**
- Consumes: members repository, `generatePassword`, UI kit
- Produces actions (all start with `requireAdmin()`):
  - `createMemberAction(prev: FormState, fd: FormData): Promise<FormState>` → on success `redirect("/admin/members/{id}?created=1")`
  - `updateMemberAction(id: string, prev: FormState, fd: FormData): Promise<FormState>`
  - `setMemberStatusAction(id: string, status: UserStatus): Promise<void>`
  - `resetPasswordAction(id: string): Promise<{ password?: string; error?: string }>` — returns the new plain password once to show the admin
  - shared `interface FormState { ok?: boolean; error?: string; fieldErrors?: Record<string, string> }` in `src/actions/admin/form-state.ts`

- [ ] **Step 1:** zod `memberSchema`: login `/^[a-z0-9._-]{3,32}$/` (message «3–32 символа: латиница, цифры, . _ -»), role enum, firstName/lastName 1–40, specializationId in `SPECIALIZATIONS` ids, roleTitle 2–60, stack ≤ 80, bio ≤ 600, skills = comma-separated string → trimmed non-empty array (≤ 20), github/linkedin/portfolio optional `url()`. Create also requires password 8–64.
- [ ] **Step 2:** Actions: parse → repository → map `ConflictError` to `fieldErrors[field] = "Логин уже занят"`, `NotFoundError` to `error: "Участник не найден"`, other errors → `console.error` + `error: "Не удалось сохранить. Попробуйте ещё раз."`; on success `revalidatePath("/admin/members")`, `revalidatePath("/team")`, `revalidatePath("/team/" + id)`.
- [ ] **Step 3:** List page: `searchParams` `q`, `role`, `status`; filters as a GET form (inputs + selects + «Применить»); `DataTable` columns: Имя (link), Логин, Роль, Направление, Статус badge.
- [ ] **Step 4:** New page: `MemberForm` (client, `useActionState`) with password field + «Сгенерировать» button filling it via `generatePassword` called through a tiny server action `generatePasswordAction()`; after create, edit page shows a one-time notice «Участник создан. Передайте логин и пароль.» when `?created=1`.
- [ ] **Step 5:** Edit page: same form prefilled (no password field); side panel: status + `ConfirmButton` «Деактивировать»/«Активировать»; `PasswordReset` button showing the new password once with a copy button; link «Открыть публичный профиль».
- [ ] **Step 6: Verify** — Playwright: create `test.dev` → redirected to edit page with notice; duplicate login shows «Логин уже занят»; deactivate → `/team/test.dev` returns 404; reactivate → 200.
- [ ] **Step 7: Commit** — `feat: add members management to admin`

---

### Task 9: Teams admin

**Files:** Create `src/server/validation/team.ts`, `src/actions/admin/teams.ts`, `app/(admin)/admin/teams/{page,new/page,[id]/page}.tsx`, `src/components/admin/teams/TeamForm.tsx`, `src/components/admin/MembershipEditor.tsx` (shared with Task 10)

**Interfaces:**
- Produces: `createTeamAction`, `updateTeamAction(id, prev, fd)`, `upsertTeamMemberAction(teamId, prev, fd)` (fd: `userId`, `role`), `removeTeamMemberAction(teamId, userId)`
- `MembershipEditor({ members: Array<AdminMember & { membershipRole }>, candidates: AdminMember[], upsertAction, removeAction })` — table of current members with role select (submits upsert) and `ConfirmButton` remove; add row = user select (ACTIVE candidates not yet in list) + role select + «Добавить».

- [ ] **Step 1:** zod `teamSchema`: name 2–60, description ≤ 400. **Step 2:** actions as in Task 8 pattern; revalidate `/admin/teams`, `/admin/teams/[id]`. **Step 3:** list (Название, Участников, Создана), new, edit page = `TeamForm` + `MembershipEditor`.
- [ ] **Step 4: Verify** — Playwright: create team, add two members, change one to TEAM_LEAD, remove one.
- [ ] **Step 5: Commit** — `feat: add teams management to admin`

---

### Task 10: Projects admin

**Files:** Create `src/server/validation/project.ts`, `src/actions/admin/projects.ts`, `app/(admin)/admin/projects/{page,new/page,[id]/page}.tsx`, `src/components/admin/projects/ProjectForm.tsx`

**Interfaces:**
- Produces: `createProjectAction` (redirect to `/admin/projects/{id}`), `updateProjectAction(id, prev, fd)`, `upsertProjectMemberAction(projectId, prev, fd)`, `removeProjectMemberAction(projectId, userId)`; reuses `MembershipEditor`.

- [ ] **Step 1:** zod `projectSchema`: id slug `/^[a-z0-9-]{2,40}$/` (create only), name 2–60, description 10–200, details ≤ 2000, status/category/origin enums, year `/^\d{4}$/`, image `url()`, stack comma list, demoUrl/githubUrl optional `url()`, featured checkbox → boolean.
- [ ] **Step 2:** actions; revalidate `/admin/projects…`, `/projects`, `/projects/[id]`, `/` and `/team` (member path changes).
- [ ] **Step 3:** list (Название, Статус badge, Категория, Участников), new, edit = `ProjectForm` + `MembershipEditor`.
- [ ] **Step 4: Verify** — Playwright: add `test.dev` to `amanat` as DEVELOPER → `/projects/amanat` lists them and `/team/test.dev` shows Amanat with «Разработчик».
- [ ] **Step 5: Commit** — `feat: add projects management to admin`

---

### Task 11: Client requests admin

**Files:** Create `src/actions/admin/requests.ts`, `app/(admin)/admin/requests/{page,[id]/page}.tsx`, `src/components/admin/requests/StatusSelect.tsx`

**Interfaces:** Produces `setRequestStatusAction(id: string, prev: FormState, fd: FormData): Promise<FormState>`; `REQUEST_STATUS_LABELS: Record<RequestStatus, string>` (Новая, На рассмотрении, Принята, В работе, Завершена, Отклонена) in `src/components/admin/requests/labels.ts`.

- [ ] **Step 1:** list with status filter (GET `?status=`), columns Дата, Клиент, Компания, Проект, Тип, Статus badge; empty state «Заявок пока нет».
- [ ] **Step 2:** detail: all fields (email as `mailto:`, phone as `tel:`), `StatusSelect` form; revalidate list, detail, `/admin`.
- [ ] **Step 3: Verify** — Playwright: submit `/contact` → visible at top of `/admin/requests` with «Новая»; set «Принята» → persists after reload.
- [ ] **Step 4: Commit** — `feat: add client requests management to admin`

---

### Task 12: End-to-end check

- [ ] **Step 1:** Run the full Playwright scenario from spec §5 (1–7) in one scratchpad script against `bun run dev` (or the user's running dev server), with credentials read from `.env` in-script and never printed.
- [ ] **Step 2:** `bun run test`, `bun run build`, `bun run lint` (no new problems vs. the 2 pre-existing errors).
- [ ] **Step 3:** Fix anything found; commit `fix: …` per issue.
