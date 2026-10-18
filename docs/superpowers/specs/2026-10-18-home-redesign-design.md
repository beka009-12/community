# Homepage redesign (everything below the hero)

Date: 2026-10-18. Status: draft for approval. Visual reference: the brainstorm
mockup "Вариант C, версия 2" (`.superpowers/brainstorm/…/showcase-c-v2.html`,
local only) — this document is the source of truth where they differ.

## Intent

The user finds the current homepage below the hero "не так красиво и скучно":
seven sections built from the same dark cards at the same rhythm, with no
focal point. The hero (`Welcome`) stays exactly as it is; everything under it
is replaced.

The page serves two visitors, and each must see where to click:

- **A company** that wants to order a project built by the community team
  (hiring an individual member is rare). Path: see what the community builds →
  see what it can build for them → trust the process and the people →
  «Заказать проект» (`/contact`).
- **A student / junior developer** who wants to join. Path: see the real
  products they would work on and the team leads who would review them →
  «Подать заявку» (Telegram).

Projects in the API are the community's **own products**, built in-house —
not client work. Copy must never present them as client cases.

The user's reference is apple.com: minimal, a lot of air, large type, one idea
at a time — but with the complaint that on apple.com it is not obvious what to
click on a first visit. So: Apple-like restraint, explicit calls to action.

## Goals

- One memorable moment (the product showcase); everything else quiet.
- Clear, separate actions for the two audiences, not mixed in one button row
  until the very end.
- Show only real data from the API that exists today (projects, stats, team
  leads); the design must look intentional with today's data and absorb richer
  data later without redesign.

## Non-goals

- The hero (`src/components/hero-sections/Welcome.tsx` and its SCSS): untouched,
  including its copy (which talks about hiring — the user chose to keep it)
  and its hardcoded «120+ специалистов». The numbers tile below still shows
  the live API values (12 members today): the user chose real data over
  matching the hero, knowing the two numbers differ.
- Header, footer, other pages, the admin and the cabinet.
- Backend/API changes, new endpoints, image upload.
- A new palette or new fonts.

## Anti-goals (would be a failure even if it works)

- Projects framed as client portfolio / case studies.
- Fake data: invented numbers, invented people, placeholder photos presented
  as real team leads.
- Fade-and-slide-up entrance on every section; hover effects on every card.
- The same card treatment repeated section after section (what the user
  called boring).

## Page structure (top to bottom)

`src/components/Hero.tsx` (the server component that composes the homepage)
renders, in order:

### 0. Hero — unchanged

`Welcome`, as today.

### 1. Product showcase — «Продукты, которые мы строим сами»

- Heading: «Продукты, которые мы строим сами».
- Lead: «Собственные проекты сообщества. На них участники набирают опыт,
  а компании видят, как мы работаем.»
- Link «Все проекты» → `/projects`.
- Projects from `getProjects()`, in API order, every status, **at most 6**
  (designer's call: keeps the company path to the services and «Заказать
  проект» short as the catalogue grows; today there are 5, so all show). When
  there are more than 6, the plates stop at 6 and «Все проекты» carries the
  rest. Each project is a large "plate" (full container width, tall, large
  radius):
  - project name, large, in the display font;
  - `category` (free text; all live projects have one today, e.g. Education,
    Web) as a quiet label next to the status chip, omitted when empty;
  - status chip using the existing labels (`PROJECT_STATUS_LABELS`) and a
    colour per status (Completed → signal green, In progress → accent,
    Planned / Paused → neutral);
  - background: `preview_image` when present, otherwise the existing
    gradient fallback of `ProjectCover` (accent radial + surface gradient).
    Today no project has an image; when images arrive they must just work;
  - the whole plate links to `/projects/[id]` with a visible
    «Открыть проект» affordance.
- **Desktop motion (the signature moment):** the section is pinned while the
  user scrolls through it; each next plate slides up and covers the previous
  one, and the covered plate scales down slightly and dims (scroll-linked, see
  Motion). Scroll distance is proportional to the number of projects.
- The section is hidden when the API returns no projects (as today).

### 2. Services — «Что сделаем для вашей компании»

- Heading: «Что сделаем для вашей компании». Lead: «Та же команда, тот же
  процесс, только под вашу задачу.»
- Primary button «Заказать проект» → `/contact`, next to the heading.
- The four services from `src/data/services.ts` (`title` + `description`),
  rendered as full-width **rows of large type separated by hairlines** — no
  cards. Title in the display font on the left, description on the right.
- A row highlights (title turns accent, description brightens) on hover **and**
  on keyboard focus. Every row links to `/about#services` (the detailed
  services section); they must be real links so focus works. That section
  always opens on its first tab — deep-linking each row to its own tab would
  mean changing the About page, which is out of scope (designer's call).

### 3. Process — «Как мы работаем»

- Heading «Как мы работаем»; the four steps from today's `Pillars`
  (Анализ идеи / Дизайн и архитектура / Разработка и тестирование / Запуск и
  поддержка) with their short descriptions, in **one row of four** under a
  shared hairline. Step numbers 1–4 are kept — this is a real sequence.
- The hairline above the steps fills with the accent colour as the section
  scrolls through the viewport (scroll-linked).
- The quality note from `Pillars` («Каждый этап проходит через код-ревью…»)
  may stay as one line under the row — builder's call.

### 4. Team leads + numbers

Two tiles side by side (lead tile wider):

- **«Кто ведёт проекты»** — lead: «Тимлиды принимают архитектурные решения и
  проверяют код каждого участника.» Below it, the real team leads:
  everyone who holds the `Team_Lead` membership role in any project
  (`getProjectsWithMembers()` + `getPublicRoster()`, same join the `/team` page
  uses — `withPeople` / `projectTeams` in `src/server/api/joins.ts`),
  de-duplicated by member id. Each row: avatar (photo if `avatar`, otherwise
  initials), full name, «Тимлид, <position label>»; the row links to
  `/team/[id]`. No tabs, no placeholder photo.
- **Numbers** — the three values from `getStats()` (members, projects,
  companies) with correctly pluralised labels (`plural()`), counting up when
  they enter the viewport (`useCountUp`).
- If there are no team leads, the numbers tile takes the full width.

### 5. For students — light band, «Хочешь в команду?»

- The only light section on the page: `--color-paper` background, ink text,
  full bleed. This contrast is what separates the student path from the
  company path.
- Heading «Хочешь в команду?». Lead: «Для студентов и начинающих
  разработчиков, которые хотят опыт на настоящих проектах.»
- Three points (title + one line):
  - «Сразу в работу» — «Начинаешь с задачи в одном из наших продуктов, а не с
    тестового задания в стол.»
  - «Тимлид рядом» — «Код проходит ревью, решения объясняют.»
  - «Путь к найму» — «Компании, которые приходят к нам, видят твою работу.»
- Button «Подать заявку в Telegram» (dark on light), external link to the
  Telegram entry of `SOCIAL_LINKS` in `src/data/socials.ts` (currently the
  placeholder `https://t.me/`; the user will replace it there).

### 6. Final call — «Есть задача или хочешь в команду?»

- Heading «Есть задача или хочешь в команду?». Line: «Компаниям: заявка на
  проект. Студентам: заявка в сообщество.»
- Two buttons: primary «Заказать проект» → `/contact`; ghost
  «Вступить в сообщество» → the same Telegram link.

### Removed from the homepage

Stats (as a separate section), ServicesPreview, Portfolio (card deck),
Pillars, CommunityPreview, Faq, FinalCta. Their files in
`src/components/hero-sections/` are deleted if nothing else imports them
(currently only `Hero.tsx` does). `src/animation/MagicBento.*` stays — the
About page still uses it.

## Visual system

- Palette: existing tokens in `app/globals.scss` only — `--color-ink`
  background, `--color-surface` / `--color-surface-2` tiles, `--color-paper`
  text and the student band, `--color-mist` secondary text, `--color-accent`,
  `--color-signal` for "Completed".
- Type: `--font-display` (Unbounded) for section headings, plate names and
  service titles; `--font-body` (Inter) for everything else. Headings are large
  and left-aligned (consistent with the hero). No all-caps eyebrows above
  headings, no middle-dot meta strings, no arrows appended to button text.
- Rhythm: generous vertical space between sections; hairline dividers instead
  of boxes for services and process; rounded tiles only for the showcase
  plates and the team-leads/numbers pair.
- Buttons: the existing `src/ui/Button` (primary / ghost). The dark-on-light
  button in the student band may need a variant or a local override.

## Motion

Use `motion/react` with the tokens and springs in `src/lib/motion-tokens.ts`
(no inline durations/easings) and the `motion-patterns` / `motion-foundations`
conventions already in the repo.

- Showcase pinning: `useScroll` on the section + `useTransform` per plate
  (translate in, previous plate scale ≈ 0.92–0.96 and dim). Transform/opacity
  only.
- Process line: `useScroll` progress → `scaleX` on the accent line.
- Numbers: existing `useCountUp`.
- Service rows: CSS transitions on hover/focus.
- No entrance animations on section reveal.
- `prefers-reduced-motion`: no pinning, no scroll-linked transforms, numbers
  shown at final value (the hook already does this); plates become a plain
  vertical list.

## Responsive

- ≤ 1024px (same breakpoint the hero uses): the showcase is a plain vertical
  list of plates, no pinning; services rows stack title over description;
  process steps go to one column (2×2 is acceptable on tablet); the two
  team-lead/number tiles stack; student points stack.
- No horizontal scroll at 375px.

## Data and failure behaviour

- Data is fetched in `Hero.tsx` on the server, in parallel:
  `getStats()`, `getProjects()`, plus `getProjectsWithMembers()` and
  `getPublicRoster()` for the team leads. `getProjectsWithMembers` costs one
  request per project (documented backend limitation) and is already cached by
  `react` `cache` / the public fetch cache shared with `/team`.
- No projects → no showcase. No team leads → numbers tile only.
- Stats and the project list are required, as today: if they fail, the
  `(site)` error boundary shows.
- The team-leads data is secondary (members + one request per project): if
  it fails, the error is logged and the tile falls back to the "no team leads"
  state, so a secondary tile never takes the hero and the rest of the page
  down (designer's call). Covered by a test.

## Anchors kept for the footer

`src/layout/footer/Footer.tsx` links to `/#portfolio`, `/#pillars` and
`/#community`, which today live on sections this redesign removes. To keep
the footer working without editing it, the new sections carry those ids:
showcase → `id="portfolio"`, process → `id="pillars"`, team-leads tile →
`id="community"` (designer's call).

## Constraints

- Next.js 16 App Router — read the relevant guide in `node_modules/next/dist/docs/`
  before writing code (see `AGENTS.md`).
- Server Components by default; `'use client'` only for the parts that animate
  (showcase, process line, numbers, anything using motion hooks).
- SCSS modules per section, as in the rest of `src/components/*-sections/`.
- New section components live in `src/components/hero-sections/`; naming per
  the repo: components `PascalCase.tsx`, other modules `kebab-case.ts`.
- TypeScript strict, no `any`; typed props.
- Accessibility: visible focus on every link/button, headings in order
  (`h2` per section, `h3` inside), images with alt text, AA contrast on both
  the dark sections and the light student band.

## Left to the builder

- Exact sizes, spacing and the plate height; how many viewport-heights the
  pinned showcase spans.
- Component split and file names within the constraints above.
- Whether the pinned showcase uses `position: sticky` or motion's scroll
  helpers, as long as it meets the Motion section.
- Whether the `Pillars` quality note stays.
- Tests: the project uses vitest for logic; any non-trivial data shaping
  (e.g. extracting unique team leads) gets a unit test.
