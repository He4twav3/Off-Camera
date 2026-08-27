# Current Product — UX Recommendations

> What to actually change in the live product, right now, based on
> `MEDIAMAXXING_UX_RESEARCH.md`. Everything else that research surfaced
> lives in `FUTURE_AGENCY_BACKLOG.md` instead — this file is
> deliberately short, because most of what's genuinely new from that
> research depends on schema that doesn't exist yet (`PRODUCT_VISION.md`
> §19), and building the UI for it now would mean either fake data or
> an empty shell. No changes have been made yet — this is the
> recommendation, not the diff.

## MUST DO NOW

**Fix a stale hardcoded module count.** `continue-learning.tsx`'s
finished-course state still reads *"All 8 modules complete"* as literal
text. This is the same class of bug already caught and fixed elsewhere
this session (`dashboard/page.tsx`'s pre-enrollment card, which now
reads `TOTAL_MODULES`/`TOTAL_LESSONS` from `curriculum.ts`) — this one
spot was missed. Not from the MediaMaxxing research directly, but found
while grounding these recommendations in the real dashboard code, and
it's the same correctness class, so it belongs here. Zero risk, one
line.

## SHOULD DO NOW

**A compact numbered "how it works" strip on the homepage.** MediaMaxxing
uses the same numbered-step device (large numeral, bold title, one
sentence) on all three of its audience pages — home, `/for-brands`,
`/for-agencies` — consistently enough that it reads as a proven pattern
for this category, not a one-off. Off Camera's homepage currently
explains the journey through section *sequence* (Problem → Belief →
Challenge → Proof → Training → Practice → Opportunity,
`PRODUCT_VISION.md` §13) but never states it as an explicit "here's
what happens" strip a fast-scanning first-time visitor can grasp in one
glance before committing to read the whole page. Something like *01
Learn the system → 02 Practice & create → 03 Qualify for real
opportunities* would do that — genuinely new copy and layout work,
not a template to paste in, and it should sit early (after Hero/Stats,
before the deeper Proof Showcase). Worth doing; worth treating as real
design work, not a quick insert.

## NICE TO HAVE

- **A trend indicator wherever progress is already shown** (e.g., the
  dashboard's percent-complete). MediaMaxxing pairs every headline
  number with a small trend line, which reads as "still moving," not
  static. Genuinely nice, but not free: nothing in the current schema
  tracks progress *over time*, only a current snapshot
  (`profiles.completed_lessons`) — this needs a small amount of new
  tracking before it's more than a cosmetic idea, so it sits here, not
  in "must/should."
- **Keep applying the "specific fact over vague praise" habit** to any
  new copy going forward (MediaMaxxing's success-story captions — "17
  accounts, 5,900 posts, 4 months" — never a generic testimonial line).
  Not a one-time task, just worth naming as a standing bar, matching a
  principle the site already holds itself to elsewhere.

## DO NOT BUILD YET

- **Deliverable/challenge cards, a submission flow, tier badges,
  performance-hero stat cards, or a leaderboard.** All correctly gated
  on the deliverables/creator-score schema that doesn't exist yet
  (`PRODUCT_VISION.md` §19, `FUTURE_AGENCY_BACKLOG.md`). Building any
  of these now would mean either fake data or an empty shell — exactly
  what this whole project has consistently avoided.
- **Repeating the value proposition once more at checkout**, the way
  MediaMaxxing's `/auth` page does. Looked at this one directly and
  it doesn't actually transfer: MediaMaxxing's `/auth` is a *unified,
  possibly-cold-arrival* signup+login screen, so restating the pitch
  there is a real safety net. Off Camera's `/checkout` is only ever
  reached after someone has already read the full `/course` pitch and
  clicked "Enroll" — it already does the analogous job well (a real
  order summary: module/lesson count, templates, community, lifetime
  access, price, `checkout/page.tsx`). Adding more persuasive copy at
  the actual payment form risks adding friction right where a buyer
  wants the fewest possible reasons to hesitate, not more selling. This
  is a case where a pattern that works well on a reference product
  genuinely doesn't fit our different flow — noting it explicitly
  rather than recommending it out of habit.
