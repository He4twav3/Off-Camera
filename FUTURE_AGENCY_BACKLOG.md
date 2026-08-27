# Future Agency Backlog

> Features and architecture we do **not** need immediately, but should
> design toward — so the current build doesn't have to be rebuilt to
> reach them later. Nothing here is scheduled or approved for
> implementation; this is a parking lot, checked against
> `PRODUCT_VISION.md` before anything on it gets scoped for real. Where
> an item was prompted by studying MediaMaxxing, that's noted — see
> `MEDIAMAXXING_UX_RESEARCH.md` for the full reasoning.
>
> Every item here should still answer `PRODUCT_VISION.md` §17's four
> questions before it's ever built: does this help train, evaluate,
> verify, or eventually sell a creator's capability to a brand? If not,
> it doesn't belong on this list either, no matter how useful it looked
> on a reference product.

---

## Creator infrastructure

- **Deliverable-linked creator profile** — formats demonstrated,
  strongest capabilities, performance history. Conceptual shape already
  sketched in `PRODUCT_VISION.md` §15; MediaMaxxing's success-story
  cards (tier badge + trend + specific factual caption) are a concrete
  visual reference for how to render it once real data exists.
- **Verification tier as a real field**, not just a concept — `tier` on
  `applicants` (`verified` / `performance` / `top`), rendered as a
  small badge component. No tier gets assigned by anything other than
  real evaluated deliverables — never by course completion alone
  (`PRODUCT_VISION.md` §2, §15).
- **Portfolio view** — a creator's own approved deliverables, presented
  by mechanism (hook type, format, structure), not just a footage grid
  — this is already the explicit teaching point of curriculum module
  "Building a portfolio that shows the formula, not just the footage"
  (`curriculum.ts`), so the profile UI should reinforce the same idea
  rather than default to a plain video grid.
- **Availability / campaign preferences** — whether a verified creator
  is currently open to brand work. Only meaningful once Layer 3 exists.

## Campaigns (training challenges now, brand briefs later)

- **Deliverable/challenge system** — the single highest-leverage gap
  from this research (`MEDIAMAXXING_UX_RESEARCH.md` §7). A `deliverables`
  table: module id, creator id, submission (content link, platform,
  caption/notes), status (`submitted` / `in_review` / `revision_requested`
  / `approved` / `rejected`), and once published, performance data.
  Populate first with training challenges (`PRODUCT_VISION.md` §14's
  examples — three hook variations, a silent product demo, a re-hook
  video), styled as cards close to MediaMaxxing's campaign-card shape
  (brief, deadline, status, single clear action) but pointed at our own
  content, never a brand brief.
- **Brand brief submission** — once Layer 3 is real, a brand-facing
  version of the same underlying table: brief text, product, budget,
  deadline, requirements. Same shape as the training-deliverable table
  above, different source and audience — design the schema so this
  isn't a second table bolted on later, it's the same concept with a
  different origin.
- **Creator matching** — admin-assisted at first (mirrors how
  `applications`/`assignments` are matched manually today), automated
  later once there's enough real data (format range, reliability,
  performance) to match on.

## Performance

- **Performance-hero stat card** — the MediaMaxxing success-story card
  shape, re-pointed at views/deliverables/rank instead of dollars
  (`MEDIAMAXXING_UX_RESEARCH.md` §8) — shown once a creator has real
  practice-content performance to display, never before.
- **Creator score** — already specified conceptually in
  `PRODUCT_VISION.md` §14 (performance / execution / creative range /
  reliability dimensions). Needs the deliverables table above before it
  can compute anything real.
- **Leaderboard** — post-paywall only, per `PRODUCT_VISION.md` §4/§14.
  Depends entirely on the deliverables + creator-score work above;
  building the UI before there's real underlying data would mean
  showing either fake numbers or an empty leaderboard, neither useful.
- **Campaign/brand-facing performance reporting** — Layer 3 only; a
  brand's view into how their specific campaign performed across the
  creators assigned to it.

## Payments

- **Creator payouts** — already partially real (`payouts` table,
  `applicant_payout_amount` on `assignments`) for brand-campaign work.
  Extending this to deliverable-based bonuses/incentives
  (`PRODUCT_VISION.md` §14) is additive to the existing schema, not a
  rebuild.
- **Invoicing** — templates already exist and ship today
  (`sidebar-cards.tsx`'s downloadable contract/pitch templates); an
  actual in-product invoicing flow is future work, not urgent while
  brand-campaign volume is low.
- **Bonuses tied to challenge performance** — depends on the
  deliverables + creator-score work above.
- **How a future campaign would actually be funded, once Layer 3 is
  real.** Worth recording now while it's fresh: the standard mechanism
  across this whole platform category (general knowledge, corroborated
  by MediaMaxxing's own `/for-brands` copy — "pay per view," "pour
  budget into what's already working") is that **the brand deposits a
  campaign budget upfront, at a set rate per 1,000 views, before any
  creator payout happens** — the platform never fronts its own money
  to pay creators, it pays out of the brand's own pre-funded pool as
  verified views accumulate, and takes a percentage cut of that flow
  for handling escrow/tracking/payouts (one documented example
  elsewhere in the category: roughly 9% on deposit, 9% on payout).
  This is the answer to "how would we fund creator payouts" for our
  own eventual brand campaigns too — we wouldn't need to carry payout
  risk ourselves; the brand's budget is the funding source by
  construction, the same way it evidently is for MediaMaxxing.

## Relationships

- **Retainers / recurring brand-creator relationships** — explicitly
  flagged in the source research prompt as future-only
  (`MEDIAMAXXING_UX_RESEARCH.md`'s `/creator/retainers` note — the
  route itself is authenticated and unobserved, this is domain
  knowledge, not something seen on MediaMaxxing). Meaningless without
  an established base of repeat brand relationships first — Layer 3,
  and likely late in Layer 3.
- **Repeat-campaign history per brand** — a natural extension of the
  brand brief work above, once brands are a real, recurring input.

## Agency

- **Brand-facing portal** (`/for-brands`-equivalent) — a dedicated
  page, only once there's a real creator network to sell into it.
  MediaMaxxing's version is waitlist-gated; ours should be too, for a
  reason that happens to be genuinely true for us and not just a
  marketing device — a 10–12 creator roster (`PRODUCT_VISION.md` §1)
  is a real, small supply, not an infinite one.
- **Creator search/matching for brands** — depends on the profile and
  performance work above being real first.
- **White-label / reseller layer** — kept here strictly as a labeled,
  low-priority idea, not a direction. MediaMaxxing's `/for-agencies`
  offering (let a third party run their own agency on top of the
  platform) is a different business model than ours — we're building
  one agency around our own trained, verified creators, not licensing
  infrastructure out (`MEDIAMAXXING_UX_RESEARCH.md` §3/§12). Worth
  revisiting only if the core agency model is working and a real
  request for this shows up — not something to design toward
  proactively.
- **Campaign management tooling for admins** — an extension of the
  existing `admin/jobs`, `admin/applications` patterns already in the
  codebase, once campaign volume justifies more than the current
  dropdown-based manual assignment.

## Internal operations

- **Creator evaluation workflow** — an admin review UI for deliverables
  (mirrors the existing `admin/applications` review pattern), covering
  the review states from the Campaigns section above.
- **Creator ranking / internal scoring** — the internal, broader
  version of the public leaderboard (`PRODUCT_VISION.md` §14) —
  performance, execution, creative range, reliability, not views alone.
- **Quality control on submissions** — revision-request flow, feedback
  fields, before something is marked approved.
- **Creator communication** — currently ad hoc (email, per
  `sidebar-cards.tsx`'s "Request community access" mailto fallback);
  a real in-product messaging/notification layer is future work, not
  urgent at current scale.

---

## Explicitly not on this list

Anything that would require inventing data to demonstrate — a fake
leaderboard, a fake earnings number, a fake creator profile stat. Per
`PRODUCT_VISION.md` §17 and every prior pass on this project: those
get built when the real data exists to back them, not before, no
matter how much a reference product's version of the feature impresses.
