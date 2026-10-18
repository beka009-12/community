# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace everything under the homepage hero with: product showcase → services → process → team leads + numbers → student band → final call.

**Architecture:** `src/components/Hero.tsx` (server) fetches stats, projects and team leads in parallel and composes new section components in `src/components/hero-sections/`. Only the animated parts are client components (showcase, process line, count-up). Mobile / reduced-motion layout is CSS-only (`!important` over motion's inline transforms), so there is no hydration flip.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, SCSS modules, `motion/react`, vitest.

**Spec:** `docs/superpowers/specs/2026-10-18-home-redesign-design.md`

## Global Constraints

- Hero (`Welcome`) untouched; header/footer/other pages untouched.
- Existing tokens only (`app/globals.scss`); `--font-display` for headings, plate names, service titles; Inter for the rest.
- No all-caps eyebrows, no middle-dot meta, no arrows in button text, no per-section entrance animations.
- Motion values from `src/lib/motion-tokens.ts`; transform/opacity only.
- Breakpoint for the compact layout: `max-width: 1024px`.
- Naming: components `PascalCase.tsx`, other modules `kebab-case.ts`. No `any`.
- Copy exactly as in the spec.

## Review Focus

- Team-leads fetch failing → page still renders, numbers tile full width (test in Task 1).
- The same person leading several projects → listed once (test in Task 1).
- Inactive / roster-missing lead → not listed (test in Task 1).
- Reduced motion or ≤1024px → plates are a plain readable list, nothing translated off-screen (checked in Task 5 visually).
- Footer `#portfolio` / `#pillars` / `#community` still land on a section (checked in Task 5).

---

### Task 1: Team-leads data

**Files:**
- Modify: `src/server/api/joins.ts`, `src/server/api/joins.test.ts`
- Create: `src/server/api/home.ts`, `src/server/api/home.test.ts`
- Modify: `src/data/socials.ts`

**Interfaces — Produces:**
- `teamLeads(projects: ProjectDetail[], roster: MemberListItem[]): MemberListItem[]` (joins.ts) — members holding `Team_Lead` in any project, present in `roster`, de-duplicated, in order of first appearance.
- `getTeamLeads(): Promise<MemberListItem[]>` (home.ts, `server-only`) — `getPublicRoster()` + `getProjectsWithMembers()` → `teamLeads`; on error `console.error` and return `[]`.
- `TELEGRAM_URL: string` (socials.ts) — the Telegram entry's `href`.

- [ ] Tests in `joins.test.ts`: `teamLeads` lists a lead once across two projects; skips developers; skips a lead missing from the roster.
- [ ] Tests in `home.test.ts` (mock `./members`, `./projects`): returns leads on success; returns `[]` and calls `console.error` when `getPublicRoster` rejects.
- [ ] Run `bun run test` → new tests fail; implement; run → pass.
- [ ] Commit `feat: load homepage team leads with a safe fallback`.

### Task 2: Product showcase

**Files:** Create `src/components/hero-sections/Showcase.tsx`, `Showcase.module.scss`.

**Interfaces — Produces:** `Showcase: FC<{ projects: ProjectListItem[] }>` (client), section `id="portfolio"`.

- [ ] Header row: h2 «Продукты, которые мы строим сами», lead copy, link «Все проекты» → `/projects`.
- [ ] Track `height: calc(var(--count) * 80vh)`; inner stage `position: sticky; top: 0; height: 100vh` with plates absolutely stacked. `useScroll({ target: track, offset: ["start start", "end end"] })`; per plate (own component, own hooks), with `n-1` segments: plate `i>0` enters `y: "100%" → 0` over segment `i-1`; plate `i<n-1` goes `scale 1 → 0.94`, `opacity 1 → 0.5` over segment `i`. Single project: no track height, no transforms.
- [ ] Plate = `Link` to `/projects/[id]`: `ProjectCover` (bare) as background, category label (if non-empty), status chip (`PROJECT_STATUS_LABELS`, tone from `PROJECT_STATUS_TONE`), name in display font, «Открыть проект» pill.
- [ ] `@media (max-width: 1024px), (prefers-reduced-motion: reduce)`: track height auto, stage static, plates static in a column, `transform: none !important; opacity: 1 !important`.
- [ ] `bunx tsc --noEmit` clean. Commit `feat: add pinned product showcase to the homepage`.

### Task 3: Services rows and process

**Files:** Create `ServiceRows.tsx` + `.module.scss` (server), `Process.tsx` + `.module.scss` (client) in `src/components/hero-sections/`.

**Interfaces — Produces:** `ServiceRows: FC` ; `Process: FC` (section `id="pillars"`).

- [ ] ServiceRows: h2 «Что сделаем для вашей компании», lead «Та же команда, тот же процесс, только под вашу задачу.», `Button` «Заказать проект» → `/contact`; `SERVICES` as `Link` rows → `/about#services` (title display font left, description right, hairlines; accent on `:hover` and `:focus-visible`).
- [ ] Process: h2 «Как мы работаем», steps 1–4 from the old `Pillars` copy, one row of four under a hairline; accent line `scaleX` from `useScroll({ target, offset: ["start 85%", "end 50%"] })`, origin left; ≤1024px: 2×2, ≤640px: one column; reduced motion: line full.
- [ ] tsc clean. Commit `feat: add service rows and process line to the homepage`.

### Task 4: Team leads + numbers, student band, final call

**Files:** Create in `src/components/hero-sections/`: `LeadsAndNumbers.tsx` + scss (server), `CountUp.tsx` (client), `JoinBand.tsx` + scss, `Closing.tsx` + scss.

**Interfaces — Consumes:** `getTeamLeads` result, `Stats`, `TELEGRAM_URL`, `Avatar`, `fullName`, `positionLabel`, `plural`, `useCountUp`.
**Produces:** `LeadsAndNumbers: FC<{ leads: MemberListItem[]; stats: Stats }>`; `CountUp: FC<{ value: number }>`; `JoinBand: FC`; `Closing: FC`.

- [ ] LeadsAndNumbers: lead tile (`id="community"`) only when `leads.length > 0` — h3 «Кто ведёт проекты», lead copy, rows linking `/team/[id]` with `Avatar`, name, «Тимлид, <position>» (just «Тимлид» without a position); numbers tile with three `CountUp` values + `plural` labels (участник/проект/компания); numbers tile full width without leads.
- [ ] JoinBand: light band (`--color-paper`), h2 «Хочешь в команду?», lead + three points per spec, dark-on-light `Button` «Подать заявку в Telegram» (`external`, `TELEGRAM_URL`), override via a two-class selector.
- [ ] Closing: h2 «Есть задача или хочешь в команду?», line, primary «Заказать проект» → `/contact`, ghost «Вступить в сообщество» → `TELEGRAM_URL` (external).
- [ ] tsc clean. Commit `feat: add team leads, student band and closing call`.

### Task 5: Wire the page, remove old sections, verify

**Files:** Modify `src/components/Hero.tsx`; delete `Stats`, `ServicesPreview`, `Portfolio`, `Pillars`, `CommunityPreview`, `Faq`, `FinalCta` (`.tsx` + `.module.scss`) from `src/components/hero-sections/`.

- [ ] `Hero.tsx`: `Promise.all([getStats(), getProjects(), getTeamLeads()])`; render `Welcome`, `Showcase` (if projects; `projects.slice(0, 6)`), `ServiceRows`, `Process`, `LeadsAndNumbers`, `JoinBand`, `Closing`.
- [ ] Delete the old files; `grep` shows no remaining imports.
- [ ] `bun run lint`, `bunx tsc --noEmit`, `bun run test`, `bun run build` all pass.
- [ ] On the running dev server: desktop 1440, tablet 1024, phone 375, reduced motion — showcase pins/stacks on desktop, plain list otherwise, no horizontal scroll; footer anchors land on sections.
- [ ] Commit `feat: rebuild homepage below the hero` (wiring) and `refactor: remove old homepage sections` (deletions).
