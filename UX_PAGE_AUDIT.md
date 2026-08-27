# UX Page Audit

> Inventory of every real route against "what unique job does this page
> do" — done before any redesign, per your own instruction. Covers what
> actually exists today; pages the brief describes that aren't built yet
> (Onboarding, Lesson, Assignment, Submission, Performance, Leaderboard,
> Creator Profile) are listed separately at the bottom, not invented
> here — building real versions needs the same deliverables/evaluation
> schema already flagged as missing in `PRODUCT_VISION.md` §19 and
> `FUTURE_AGENCY_BACKLOG.md`. Faking them now would mean shipping pages
> with nothing real behind them, which is the same problem this whole
> project has ruled out everywhere else.

## Existing pages

| Page | Current purpose | Problem | Keep | Remove | Redesign |
|---|---|---|---|---|---|
| `/` (homepage) | Convince someone to join — the flagship pitch | Mostly sound, but now also carries the full `/launch` countdown+CTA on top of its own pitch — two "join now" asks stacked in one hero | ✅ | | Trim the overlap with `/launch` (see below) |
| `/course` | The deep-detail version for someone who wants everything before buying — full lesson-by-lesson breakdown, its own curriculum UI, purchase card | Real, distinct job — but re-renders the *entire* `ProofShowcase` and `Story` components wholesale, identical to the homepage's own copies | ✅ | | Condense the repeated sections (below) |
| `/go` | Condensed single-scroll page for paid traffic / external links | None structurally — already the correct model: own copy, no shared marketing-section reuse, explicitly scoped this way in its own code comment | ✅ | | No |
| `/launch` | Free 5-day preview signup | **The clearest case.** Reuses `ProofShowcase`, `CurriculumShelf`, and `WhoItsFor` — the same three heavy sections as the homepage. Clicking "Save My Free Spot" from `/` lands on what's functionally the homepage again, dark-inverted. This is the exact complaint. | ✅ (real, distinct job) | | **Yes — heavily.** Per your own §2 spec: countdown, short reminder of the offer, signup action, minimal reassurance. Not a second full pitch. |
| `/about` | Founder narrative | None — bespoke content, no marketing-component reuse | ✅ | | No |
| `/changelog` | Build/update log | None — functional, distinct | ✅ | | No |
| `/login` | Returning-user auth | None — already minimal (email/password + one link back to `/course#pricing`) | ✅ | | No |
| `/signup` | Redirect stub to `/course#pricing` | None — already de-duplicated this session (used to be a real signup form contradicting the pay-to-enroll model) | ✅ | | No |
| `/checkout` | Payment | None — real order summary, no sales copy repeated | ✅ | | No |
| `/dashboard` | *Should be* "what do I do next" | Mostly already there — `ContinueLearning`, `ModuleProgressList`, `StatCards` are action-first, not marketing. The pre-payment state shows a locked-course card, which is appropriate there (someone who hasn't paid yet, not a paid user seeing a sales pitch) | ✅ | | Light only — see §10 dark-system section below |
| `/dashboard/account` | Account settings | None — functional | ✅ | | No |
| `/dashboard/recruiting` + `jobs`, `jobs/[id]`, `profile-setup` | Real campaign/job management for approved creators | None — real applicant/job/assignment data, no landing-page sections present | ✅ | | Light only |
| `/admin/*` (applicants, applications, jobs, niches, payouts) | Internal ops tool | Different audience entirely (you/ops, not creators) — out of scope for a "creator journey" redesign | ✅ | | No — not part of this pass |

## Not yet built (Phase 2 — do not fake)

Onboarding, Lesson page, Assignment/Deliverable page, Submission page,
Performance page, Leaderboard, Creator Profile. None of these exist in
the codebase today. Each one the brief describes needs real data this
product doesn't have yet:

- **Onboarding / Assignment / Submission** need the `deliverables` table
  that doesn't exist (`PRODUCT_VISION.md` §19).
- **Performance / Leaderboard** need real per-creator content metrics,
  which need the deliverables table plus something to actually publish
  and track against.
- **Creator Profile** needs the `tier` field and evaluation data that
  don't exist yet.
- **Lesson page** needs the actual paid lesson videos, which haven't
  been provided (`curriculum.ts`'s own header note — never invent this
  content before it exists).

Building any of these now would mean either a page with fabricated
numbers or an empty shell wearing real-sounding labels. They stay on
`FUTURE_AGENCY_BACKLOG.md`, not built here, until the real schema work
happens.

## The repetition, quantified

Direct component-reuse across public pages (`grep` on actual imports,
not guessed):

| Page | Reuses from homepage |
|---|---|
| `/course` | `ProofShowcase`, `Story` (full re-render, not condensed) |
| `/launch` | `ProofShowcase`, `CurriculumShelf`, `WhoItsFor` (full re-render, not condensed) |
| `/go` | *(none — already scoped correctly)* |

`/launch` is the real offender — three of the homepage's four biggest
sections, verbatim. `/course` has a smaller, more defensible version of
the same problem (it exists specifically to go deeper, so *some* proof
repetition is arguably legitimate — but a full second copy of `Story`
next to a full second copy of `ProofShowcase` is still more than that
page needs).

## Dark system — actual current state

Only `/` and `/launch` are dark right now (the scoped `.dark-invert`
override built this session). Everything else — `/course`, `/go`,
`/about`, `/changelog`, `/login`, `/checkout`, the whole `/dashboard`
tree, `/admin` — is still the original light theme, untouched. §7 of
your brief asks for dark everywhere; that's a real, large, separate
piece of work from the de-duplication problem above, not something to
fold in silently.

---

## What this means for scope

Two genuinely separate projects are bundled in the brief:

1. **Fix the repetition** (§1–4) — mostly a `/launch` rebuild plus
   trimming `/course`'s duplicate sections. Concrete, scoped, doable
   now, touches pages that already exist.
2. **Dark system everywhere + navigation restructure** (§7–11) — a
   much bigger lift: extending `.dark-invert` (or a proper dashboard-
   specific dark variant, since §10 is explicit the dashboard shouldn't
   look like the landing page) across every remaining route, redesigning
   the dashboard's information hierarchy, and changing navigation. This
   touches the paid product's daily-use UI, not just marketing pages.

Recommend doing them in that order, not simultaneously — the
`/launch` rebuild is small enough to just do; the dark-everywhere,
action-first-dashboard work is big enough that I'd want to scope it
properly first rather than redesign the paid dashboard in the same pass
as fixing a landing page.
