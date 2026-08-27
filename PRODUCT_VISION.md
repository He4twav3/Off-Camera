# Off Camera — Product Vision

> Strategic source of truth for the whole business direction, not just
> the current website. When a landing-page, curriculum, dashboard,
> deliverable, leaderboard, or verification decision needs making,
> check it against this document first.
>
> This document doesn't replace the tactical working docs already
> tracking the site build (`~/.claude/plans/fancy-sleeping-reef.md`,
> `off-camera-repositioning-brief.md`) — those record what's been
> *built*. This one records what's being built *toward*.
>
> No frontend changes shipped alongside this document. See §19 for
> where the current codebase already matches this vision and where it
> doesn't yet.
>
> **Revision note (2026-08-24):** §11 adds a restructured curriculum
> architecture based on three reference-material inputs. That
> architecture is *decided*, not yet built — `curriculum.ts` still
> reflects the earlier 8-module structure until it's actually
> implemented (§19). The curriculum is explicitly expected to keep
> changing as more real content becomes analyzable — treat §11 as
> current guidance, not a final structure.
>
> **Revision note (2026-08-24, second pass):** §20 adds findings from a
> UX/product-architecture teardown of MediaMaxxing, a mature reference
> product in this category. Full teardown lives in
> `MEDIAMAXXING_UX_RESEARCH.md`; the resulting backlog in
> `FUTURE_AGENCY_BACKLOG.md`; concrete current-product UX calls in
> `CURRENT_PRODUCT_UX_RECOMMENDATIONS.md`. §20 is the strategic summary
> and the evaluated feature-classification table only — not a repeat of
> the full research.

---

## 1. The big picture

The product currently looks like an online course. That's stage one,
not the destination.

The destination is a **creator network / agency**. The course is the
mechanism that builds it:

```
FIND → TRAIN → TEST → EVALUATE → VERIFY → DEVELOP → SELECT
```

Target: roughly 10–12 genuinely strong, verified creators we can
confidently put in front of brands.

**Not the end state:** "We sell a course about faceless content."
**The end state:** "We operate a verified network of short-form
creators who've demonstrated they can make content that performs."

---

## 2. The three stages

### Stage 1 — Training

Creators discover the program, enroll, and learn the actual
methodology. They don't just watch — they do practical assignments and
produce real content:

```
LEARN → CREATE → SUBMIT → PUBLISH → MEASURE → IMPROVE
```

This should behave like a creator training program, not a passive
video course.

### Stage 2 — Creator qualification

Creators complete deliverables. We evaluate: content execution, hook
ability, retention, creativity, format range, native/natural feel,
product integration, reliability, consistency, real performance where
available, ability to follow a brief, professionalism.

Creators who meet the bar become **Verified Creators**. Verification
is earned through demonstrated ability — **course completion alone
never qualifies someone.** Watching every lesson is not the bar; the
deliverables are the evidence.

### Stage 3 — Creator network / agency

Once enough strong creators are identified, we approach brands. The
pitch shifts from "we have students" to "we have a network of verified
creators who've already proven they can produce native content across
multiple formats." Brands hire through the network; we match based on
demonstrated ability, not self-reported skill.

The public-facing business can eventually shift from primarily
*training* to primarily *network* — training then becomes a shorter
qualification/onboarding step, or an internal screening tool, rather
than the main product. **Build the infrastructure now with that shift
in mind, without building the whole future layer today.**

---

## 3. The core product loop

```
SIGN UP → TRAIN → PRACTICE → CREATE DELIVERABLES → SUBMIT → PUBLISH
  → COLLECT PERFORMANCE DATA → ITERATE → LEADERBOARD/RANKING
  → EVALUATION → VERIFICATION → CREATOR PROFILE → BRAND OPPORTUNITIES
```

**Everything from "leaderboard" onward is post-purchase.** None of it
belongs on the public landing page.

---

## 4. Three layers: public, paid, future agency

This is the single most important structural rule in this document.

### Layer 1 — Public / pre-purchase

**Visible:** what the training teaches; the module/lesson curriculum
overview (text-only, see §13); our real high-performing content and
its view counts; examples across on-camera, off-camera, silent, and
UGC formats; the philosophy (follower count and experience aren't
prerequisites for views); that finishing the training and
demonstrating ability can *potentially* lead to creator opportunities.

**Landing-page video content is exactly two things, and nothing more:
the real TikTok/Instagram posts embedded via Knowledge Base A
(`proof-content.ts`, §7), and the one pre-purchase intro film (the
"Intro from Aron" player in `hero.tsx` / `go/page.tsx`).** Every
module/lesson video — the actual curriculum being restructured in
§10/§11 — is exclusively post-paywall, Layer 2 below, full stop. The
public curriculum overview shows lesson *titles and summaries* as text
(§13), never a video, preview clip, or embed cut from the paid
lessons themselves.

**Never visible pre-purchase:** paid lesson videos or any preview clip
cut from them, the creator leaderboard, other participants, individual
creator scores, the submission system, private assignments, the
internal performance dashboard, creator rankings, internal evaluation
criteria, the verification dashboard, private creator profiles,
competition mechanics, the internal creator network.

The landing page sells **training, proof, and opportunity** — never
the internal qualification machinery itself.

### Layer 2 — Paid product (post-purchase)

Once enrolled, the experience gets interactive. The paid product
delivers:

- **Training** — the actual modules and lessons.
- **Assignments** — specific content challenges and deliverables.
- **Submissions** — a place to upload/submit required work.
- **Performance** — tracking of submitted content and its metrics.
- **Leaderboard** — a competitive view of how participants are doing.
- **Creator score** — a broader internal read on ability, consistency,
  execution, and performance (see §14).
- **Verification** — creators meeting the standard become Verified.
- **Opportunities** — the strongest verified creators may become
  eligible for bonuses, challenges, and eventually real brand work.

All of this lives behind the paywall.

### Layer 3 — Future agency

Once enough creators are verified: brands submit briefs, request
creators, browse capabilities, launch campaigns, select creators, pay
for content/campaigns. We match brands to creators on demonstrated
ability. **The creator network becomes the core business asset**, not
the course.

---

## 5. Creators, not "students"

Don't default to thinking of users as students. They're **potential
creators moving through a qualification pipeline** — learning, but
also producing content that lets us evaluate them.

Over time the system should be able to answer, per creator: what
formats can they make (UGC, on-camera, silent/off-camera, screen
recording, POV, before/after)? What niches can they work in? Can they
follow a brief? Do they understand hooks and retention? Can they
iterate from data? Do they post consistently and hit deadlines? What
does their real content performance look like? Can they work with
brands professionally?

That's the information that makes a creator valuable to a brand — and
it's the actual product of the qualification pipeline, not a byproduct
of it.

---

## 6. Training philosophy & the core belief

The methodology isn't generic social-media advice. It's derived from
our own real content that has performed — currently a small set of
real, view-count-confirmed videos across formats (see Knowledge Base A,
§7). The course teaches the transferable mechanics behind those videos,
not a tour of one format.

**The belief being challenged:** aspiring creators tend to assume they
need a following, years of experience, expensive equipment, or
extremely polished production before their content can get views, and
that a small account guarantees no one will see their work.

**What we're actually demonstrating:** content mechanics can matter
more than follower count or production polish. This does **not** mean
"make low-quality videos" — it means don't confuse production quality
with content performance. A highly produced video with a weak hook can
fail; a simple, native-feeling video with a strong hook, retention
structure, and consistent testing can reach real numbers. The real
videos need to demonstrate this themselves — the site should never
lean on an unsupported claim to make the point for them.

---

## 7. Knowledge Base A — real performance content

Our actual published, high-performing videos (`src/lib/proof-content.ts`
in the current codebase). Public, free, and the thing the whole
methodology is derived *from* — not just examples dropped onto the
landing page after the fact.

**Never name the specific app/client these were made for anywhere on
the site or in this documentation** — refer to it generically ("an app
we made content for," "a client app"). This applies throughout this
document too.

The public "real results" section should read as *this is what we
actually did*, each entry paired with what can actually be observed
about it and what mechanism it demonstrates — not a generic caption.
Treat the strongest examples (currently: two flagship high-view-count
videos, a silent/no-talking demo, and a smaller-but-real example) as
named case studies, each analyzed on its own before being compared to
the others. Exact current figures live in `proof-content.ts` — this
document intentionally doesn't hardcode them, so it can't drift out of
sync with the real numbers on the site.

### Analysis discipline: observation vs. interpretation

Every real video gets analyzed on: first frame, first second, first
three seconds, visual hook, spoken hook, on-screen text, curiosity
mechanism/information gap, stakes, story structure, retention
structure, pacing, cuts, visual changes, demonstration, product
placement/integration, payoff, CTA, on-camera vs. off-camera, talking
vs. silent, UGC characteristics, production characteristics,
native-vs-ad-like feel, what looks repeatable vs. what's unique to
that one video.

**Separate observation from interpretation, always.**

> Observation: "The creator shows the product immediately while text
> says X."
> Interpretation: "This creates an information gap, because the viewer
> sees the object but doesn't yet understand how the claimed result is
> achieved."

Never claim causation the evidence doesn't support. If the only real
fact is "this video got 3M views," say 3M views — don't invent
retention percentages, average watch time, engagement rate, completion
rate, algorithmic-distribution data, or posting-time effects that
weren't actually measured.

### Cross-video pattern categories

Once individual videos are analyzed, compare them for repeated
patterns across:

- **Hooks** — curiosity, shock, contrarian, demonstration, result-first,
  problem, transformation, challenge, pattern interrupt, visual hook,
  stakes, aspirational outcome.
- **Retention** — open loops, curiosity gaps, pacing, information
  density, visual changes, payoff timing, demonstration, progression.
- **Volume** — number of attempts, variations, repeated concepts,
  format reuse, testing.
- **Consistency** — publishing patterns where known, repeated formats,
  backlog, iteration.
- **Distribution** — view performance, follower count where known,
  platform, timing where known. Be careful with algorithm claims —
  keep *what we observed*, *what the platform documents publicly*,
  *what we're inferring*, and *creator folklore* in clearly separate
  buckets (this exact four-tier split is formalized in §8 below).
- **Formats** — on-camera, off-camera, silent, hands-only, taped-mouth,
  text-led, UGC, product demo, screen recording, POV, before/after.
- **Native content** — rawness, imperfect framing, natural delivery,
  absence of ad language, product integration, platform-native pacing.

Don't force every successful video into one formula. If different
videos succeeded through different mechanisms, say so — that's more
useful than a false single pattern, and it's the actual proof that
"there's no one magic viral format," just repeatable principles that
show up through different formats.

### Open dependency: video-analysis tooling

The original direction for this pipeline named a specific third-party
GitHub tool to clone and run for frame-level video analysis. That's
**not being done as specified** — installing and executing an unvetted
third-party repository for this was evaluated and declined three times
now across this project, for the same reason every time: an unreviewed
package is a real supply-chain risk, and "install this and gain a new
capability" is exactly the pattern worth being suspicious of regardless
of what the capability promises.

This was tested directly, not just asserted: fetching the real TikTok
and Instagram proof-video URLs returns an empty JS shell with no
caption, thumbnail, or view count — no tool available here decodes or
watches video content from a URL. The one thing that does work is the
site's own TikTok oEmbed proxy (`/api/tiktok-oembed`), which returns a
caption and a single static thumbnail image — a long way from frame-by-
frame comprehension.

This is a genuine open item, not a resolved one. Real options once
it's worth solving: the account holder describes each video directly
(what happens, in order — that's already how the current real-video
breakdowns in `proof-content.ts` got written), a vetted first-party
video-understanding tool if/when one exists, or manual shot-by-shot
notes supplied by the account holder. Don't assume a specific tool
here going forward — flag it as a decision still needed. §11 hits this
same wall when it tries to connect reference material to our own real
footage.

---

## 8. Reference material: a third kind of input

Real content (Knowledge Base A, §7) and paid course content (Knowledge
Base B, §10) aren't the only inputs shaping the methodology. A third
kind exists: **reference material** — other creators' public theories,
tactics, and frameworks about what works on short-form platforms.
Genuinely useful (often close to practitioner consensus, or a
codification of patterns experienced creators have noticed), but
categorically different from the other two: it isn't proof (nobody
here made or verified it), and it isn't our own teaching yet — it's an
input to be evaluated before it becomes either.

Every claim pulled from reference material gets sorted into one of
four confidence tiers before it's allowed to shape a lesson:

| Tier | What it means | Example |
|---|---|---|
| **What we know** | Directly verifiable, or confirmed ourselves | A specific video's real view count |
| **What creators observe** | Widely reported by practitioners, not officially confirmed by the platform | "Accounts that post heavily right away tend to get less reach at first" |
| **What we infer** | A plausible mechanism we're reasoning toward, not proven | "Coherent early engagement probably helps a recommendation system categorize an account faster" |
| **What's uncertain / folklore** | Stated as fact by a source with no real evidence behind it | "You need exactly 7 days of warming before you're safe to post" |

The rule: teach tier 1 and 2 plainly, teach tier 3 as a
reasonable-but-unproven inference, and either drop tier 4 entirely or
label it explicitly as unconfirmed folklore if it's worth mentioning at
all. Never let a tier-4 claim get taught with the confidence of a
tier-1 fact — that's the exact mistake most creator-theory content
makes, and it's usually why "algorithm hacks" don't survive contact
with a second account that did everything the same way and got a
different result.

---

## 9. How to teach it: principles, patterns, formulas, and creative choices

A second, separate framework — about *teaching form*, not confidence.
Every mechanism worth teaching gets classified along this ladder, from
most to least universal:

- **Principle** — broadly true, format-agnostic. *"Give the viewer a
  reason to keep watching, not just a reason to start."*
- **Pattern** — something repeatedly observed across multiple real
  examples, once there are enough real examples analyzed to call it
  repeated (this tier is genuinely on hold for our own content until
  §7's open dependency is resolved).
- **Formula** — a specific, repeatable structure a creator can
  deliberately test. *"Hook → Retention Bait → Value → Re-hook →
  Payoff → Tight Ending."*
- **Creative choice** — a specific decision that worked once, real and
  worth showing, but not a law. The "doctor's salary" framing (already
  treated exactly this way in `curriculum.ts` today, as a named case
  study) is the model — never generalized into "every silent demo
  needs an aspirational dollar figure."

A lesson can, and often should, contain all four at once: state the
principle, name it as a pattern once real evidence supports that, hand
the creator a formula to actually test, and show a creative example
without asking them to copy it exactly. Both this framework and §8's
confidence tiers apply together — every lesson in §11 below was run
through both.

---

## 10. Knowledge Base B — paid course content

The actual educational videos someone pays to access
(`src/lib/curriculum.ts`). Private, paid, structured around the
transferable mechanics rather than a rerun of the real proof videos.

**Live in code today:** 8 modules — Hook → Retention → Volume →
Consistency → Timing & Distribution → Iteration → Content Formats →
Monetization — 28 lessons total. Each module carries one concrete
`practice` assignment — the visible seam between "training" and "the
creator must produce" — and as of this project's most recent dashboard
pass, that assignment is now shown inside the paid dashboard itself,
not only the public marketing pages.

**Decided target, not yet implemented:** §11 restructures this to 9
modules / 35 lessons, based on three reference-material inputs analyzed
against the structure above. `curriculum.ts` has not been changed yet
— see §11 for the reasoning, and §19 for what actually implementing it
will require.

### The paid lesson videos themselves are a separate, later job

The module videos are the actual thing being sold — a different video
set entirely from the real proof content in Knowledge Base A. **Don't
invent their specifics before they exist.** When they're actually
provided:

1. Analyze each one (same discipline as §7, once the tooling question
   is resolved) for: what's actually taught, main concept, supporting
   concepts, examples/demonstrations used, key takeaways, the practice
   exercise, expected outcome, terminology, any claim that needs
   verifying.
2. Use that analysis to write accurate module/lesson descriptions,
   learning objectives, and practice descriptions — replacing today's
   outline copy with what the lesson actually contains.
3. Keep the videos behind the paywall. Never cut a "module preview"
   from paid footage for the public site.

---

## 11. Curriculum architecture v2 (decided 2026-08-24 — not yet built)

Three reference concepts prompted this pass: account warming/"baking,"
pre-launch niche signaling (with a comment-to-DM funnel mechanic), and
a more detailed hook→retention→value→ending framework with re-hooking
throughout. Each is analyzed below against the existing 8-module
structure — the goal was never "add three modules," it was determining
where each concept actually belongs.

### Reference 1 & 2 — account warming and niche signaling

What they actually describe: preparing a new account before posting
heavily, building a coherent niche identity, engaging with relevant
content pre-launch, avoiding random/spammy activity, and (reference 2
specifically) a curiosity → CTA → comment → DM funnel mechanic.

Running it through §8's confidence tiers: "an account with random,
unrelated activity gives a mixed signal about what it is" sits at
**what creators observe**, bordering on **what we infer** — plausible,
widely believed among practitioners, not something a platform documents
precisely. "You need exactly N days of warming" or "skipping this gets
an account flagged" sits at **uncertain/folklore** — stated with false
precision, not to be taught as fact.

**Verdict: a genuinely new skill domain**, not covered anywhere in the
existing 8 modules. Timing & Distribution is about *per-video*
distribution decisions (when to post, platform mechanics) — this is a
*one-time, pre-content* setup step. Different verb tense ("decide every
time you post" vs. "do once before you start") — reason enough for a
module of its own.

Counter-argument considered and rejected: folding it into Timing &
Distribution would avoid growing the module count, but it would bury a
one-time foundational step inside an ongoing-decisions module. Per the
explicit instruction that this shouldn't become a distraction, a
*small, clearly-bounded* standalone module is actually better at
keeping it contained than folding it into a bigger one where it could
sprawl.

**New module — Account & Niche Foundations.** Deliberately the shortest
module in the curriculum (3 lessons), placed first since it precedes
content creation entirely. The philosophy stays PREPARE → CREATE →
PUBLISH → LEARN, not PREPARE FOREVER:

1. *Choosing a niche and making an account's identity coherent* — one
   niche, everything about the account (bio, first posts, who it
   follows) pointing at it consistently.
2. *Warming up a new account before you post heavily* — what's actually
   known (looking like a normal, active account before heavy posting is
   a reasonable idea) stated separately from folklore (a precise
   day-count, or a claim about flagging), per §8.
3. *Reading the signals your activity sends before you ever post* — the
   niche-signaling concept from reference 2, same fact/folklore
   discipline applied to any claim about how a recommendation system
   actually weighs it.

*Practice:* Set up (or audit) one account around a single coherent
niche, and spend a few days engaging naturally in that niche before
your first real post.

The curiosity→CTA→comment→DM mechanic from reference 2 is a different
thing — not account setup, but converting a video's curiosity into an
owned channel (DM/list), which is an audience-monetization mechanic. It
goes into Monetization, not here (see below), and deliberately doesn't
copy the specific "comment a word" execution — the transferable part is
the shape, not the trend-specific wording.

### Reference 3 — hook → retention bait → value → ending, and re-hooking throughout

This one doesn't introduce a new skill domain — it's a substantially
more detailed version of one that already exists. Its Hook step matches
the current Hook module almost exactly ("why should I stop scrolling"
is already that module's first lesson) — no change needed there.
Everything else (retention bait, authority, re-hooking/open-closed loop
cycling through the value section, tight endings) is a deeper retention
framework than the current 3-lesson Retention module covers.

**Verdict: expand Retention significantly, don't split it into a new
module** — same skill (keeping someone watching), taught in more depth.
3 lessons → 6:

1. *Open loops, curiosity gaps, and pacing* — existing, unchanged, the
   foundational concept everything below specializes from.
2. *Retention bait: giving people a reason to keep watching, not just a
   reason to start* — **new**. The gap between "you stopped scrolling"
   and "you're actually invested" — a stated promise, implied stakes,
   or a reason to trust the creator specifically, placed right after
   the hook.
3. *Structuring a video so the hook actually pays off* — existing,
   unchanged (payoff placement).
4. *Re-hooking: keeping the middle of a video from becoming one long
   explanation* — **new**. Retention isn't only a first-three-seconds
   problem — cycling a small open question, its answer, and a new
   question keeps the middle of a video from reading as one
   uninterrupted stretch. Deliberately called "re-hooking," not
   "dopamine loops" — the mechanism is worth teaching, the
   neuroscience-flavored label isn't something to present as settled
   science (per §8).
5. *Where most videos lose viewers, and how to fix it* — existing,
   unchanged (mid-video drop-off diagnosis).
6. *Ending on the payoff: why a tight ending beats a long outro* —
   **new**. Cut immediately after the video delivers what it promised —
   no drawn-out sign-off — which tends to read as more complete and
   leaves less time for someone to swipe away before it's actually
   over.

*Practice, expanded to match:* Storyboard one video's retention curve,
including at least one re-hook, before you film it.

### The comment-to-DM funnel → Monetization, reordered

Belongs in Monetization (an audience-monetization skill), placed
**first** in that module, ahead of the existing pitch/portfolio/pricing
lessons — building your own audience funnel doesn't depend on ever
pitching a brand, so it's the more foundational, self-directed path,
with brand-pitching as the next step once there's leverage to pitch
with:

1. *Turning views into an audience: comment-to-DM and other capture
   funnels* — **new**. The generalized mechanism (content creates
   curiosity → a CTA converts it into an action → that action leads to
   a warmer follow-up you control), not any single trending version of
   the wording — the wording goes stale, the shape doesn't.
2. *Building a target list and the cold pitch that gets replies* —
   existing (was #1).
3. *Building a portfolio that shows the formula, not just the footage*
   — existing (was #2).
4. *How brands and the creator network actually pick people* —
   existing (was #3).
5. *What to charge, by deliverable* — existing (was #4).
6. *Contracts, invoicing, and getting paid on time* — existing (was
   #5).

### What didn't change, and why

Volume, Consistency, Timing & Distribution, Iteration, and Content
Formats are untouched — none of the three references introduced a
skill in those domains, and the instruction was explicit: don't grow a
module just to grow it.

### The resulting architecture (target — not yet in `curriculum.ts`)

| # | Module | Lessons | Status |
|---|---|---|---|
| 1 | Account & Niche Foundations | 3 | **New** |
| 2 | Hook | 4 | Unchanged |
| 3 | Retention | 6 | **Expanded from 3** |
| 4 | Volume | 3 | Unchanged |
| 5 | Consistency | 3 | Unchanged |
| 6 | Timing & Distribution | 3 | Unchanged |
| 7 | Iteration | 3 | Unchanged |
| 8 | Content Formats | 4 | Unchanged |
| 9 | Monetization | 6 | **+1, reordered** |

**9 modules, 35 lessons** (up from 8/28). Every addition traces to a
specific new skill or a specific gap in an existing module's depth —
nothing was added to hit a round number, and nothing existing was cut.

### Still blocked: connecting this to our own real content

Reference 3 explicitly asks whether our own flagship videos actually
use a strong hook, a retention-bait beat, re-hooking, a clear payoff —
that comparison is exactly what would move "pattern" (§9) from
theoretical to evidenced. It isn't done here, for the same reason noted
in §7: there's still no working way to actually watch the real proof
videos and verify this frame by frame (confirmed directly, not just
assumed — see §7's open-dependency note). Until that's resolved, this
architecture is grounded in the reference material's own internal logic
and the observation/interpretation discipline above, not yet in "here's
where this shows up in our own 15.1M-view video." Worth closing before
this gets called final.

### Not final

This is one pass, based on three references, against the existing 8/28
structure. It's explicitly not locked — the rest of the real content
library, once it's analyzable, may reshape this further.

---

## 12. How Knowledge Base A and B relate

```
OUR REAL VIDEOS (Knowledge Base A) + REFERENCE MATERIAL (§8, tiered)
        ↓
   what did we learn from them?
        ↓
CONTENT METHODOLOGY
Account & Niche → Hook → Retention → Volume → Consistency →
        Distribution → Iteration → Format → Monetization
        ↓
PAID TRAINING (Knowledge Base B) — the creator learns the methodology
        ↓
PRACTICE — the creator makes their own content
        ↓
DELIVERABLES — the creator demonstrates the skill
        ↓
EVALUATION → VERIFICATION → CREATOR NETWORK
```

Never mix the knowledge bases. A's job is proof and methodology
discovery; reference material (§8) is a tiered input into that same
discovery step, never taught with more confidence than its tier
supports; B's job is teaching the resulting methodology. B's lesson
notes are never a claim about A's specific unseen footage (or vice
versa).

---

## 13. The landing page

### Positioning shift

Not: *"Learn how to make faceless videos."* That was the earlier
framing and it's already superseded. Off-camera/silent is **one format
taught inside the training**, not the product's whole identity. The
accurate framing: *learn how to create short-form content that
performs* — across on-camera, off-camera, silent, hands-only,
taped-mouth, natural UGC, product demos, screen recordings, POV, and
before/after — built on the same underlying principles taught in the
course (§10, §11).

### The narrative arc

```
PROBLEM   "No following / no experience / don't want to show my face /
           my videos don't get views / no expensive equipment."
   ↓
BELIEF    "You need all of that to succeed."
   ↓
CHALLENGE You don't.
   ↓
PROOF     Our real videos — real accounts, real view counts.
   ↓
EXPLAIN   The principles behind them (Hook → Retention → Volume →
          Consistency → Distribution → Iteration → Format).
   ↓
TRAIN     Learn the system.
   ↓
OPPORTUNITY  Finish the training, create real content, demonstrate
             ability, and potentially qualify for creator
             opportunities — earned, never promised.
```

This already matches the arc implemented on the current homepage (see
`fancy-sleeping-reef.md`) — this document is confirming the direction,
not changing it.

### The strict visibility rule

The public page should never feel like a social network. It sells the
methodology, the proof, and the training — not the machinery behind
qualification. A visitor's first impression should be *"this is a
serious training system built on real content."* Only after enrolling
should they discover *"I'm not just watching a course, I'm entering a
creator qualification pipeline"* — that reveal is part of what makes
the paid experience feel substantial, and it only works if the public
page didn't already spoil it.

### Curriculum stays text-only

No public "module preview" clips (an earlier version of the site had
these — already removed, see `fancy-sleeping-reef.md`). Public
curriculum shows module title, a short description of what's taught,
lesson titles, concise summaries, and the practice/outcome line —
enough to know what you're buying, never the paid lesson itself.

---

## 14. The paid product: deliverables, leaderboard, scoring

Everything in this section is **Phase 2 build** — not shipped yet (see
§19 for exactly what exists today vs. what doesn't).

### Deliverables

Practical challenges tied to what's being taught, submitted through
the platform once that exists. Directional examples, not a locked
list — the real set should evolve once the paid lesson videos (§10)
are actually analyzed, and once curriculum architecture v2 (§11) is
implemented: three hooks for one concept; a retention-bait-plus-re-hook
video; several variations on one concept; a silent/off-camera product
demo; natural UGC; on-camera content; a stronger second version of an
underperforming video; spec content for a target brand; a coherent,
warmed niche account.

The non-negotiable principle: **the creator must produce.** Watching
the course is never sufficient on its own.

### Leaderboard — post-paywall only, never on the public site

After enrollment, creators can eventually see their position, other
participants, performance rankings, views, best-performing content,
score, and progress. It's meant to create real competition and push
people to actually publish.

Don't reduce the whole qualification system to "most views wins" —
view counts carry real algorithmic randomness. The *public-facing*
leaderboard can lean heavily on performance; the *internal* evaluation
underneath it needs to be broader (see next).

### Creator score

A qualification tool, not a public "algorithm score." Candidate
dimensions:

| Dimension | What it covers |
|---|---|
| Performance | Views, average views, best video, engagement where relevant |
| Execution | Hook, retention, story structure, editing, product integration |
| Creative range | On-camera, off-camera, silent, UGC, product demos, screen recordings, other formats |
| Reliability | Deliverables completed, deadlines, brief compliance, consistency |

### Incentives

Strongest performers can receive bonuses and/or real brand
opportunities, potentially through structured challenges (brief →
create → submit → publish/test → measure → top performers rewarded).
**Never promise every participant a brand deal or guarantee a
campaign** — availability depends on creator performance, reliability,
brand demand, and what opportunities actually exist at the time. Frame
it as something a creator can earn, not something the purchase itself
buys.

---

## 15. Verified Creator & creator levels

**Verified Creator ≠ finished the course.** It means the creator has
completed the required training *and* deliverables, demonstrated
multiple content skills, produced real published content, been
evaluated against a real standard, shown reliability, and shown they
can follow a brief.

A conceptual creator profile (illustrative shape only — every number
below is a placeholder, never fabricate a real creator's stats):

```
VERIFIED CREATOR ✓
Formats: UGC · Product Demo · On-Camera · Silent · Screen Recording
Deliverables: 18 submitted · Published: 15
Total Views: 1.8M · Best Video: 680K
Capabilities: Hook 9/10 · UGC 10/10 · Product Integration 9/10
```

Possible tiering, to refine later: **Verified Creator** (passed
qualification) → **Performance Creator** (demonstrated strong
real-world performance) → **Top Creator** (one of the strongest in the
network). Conceptual only — not built, not promised publicly.

---

## 16. The future agency

Once enough creators are verified, the site can grow a second
front-facing surface alongside (eventually instead of) the course:
**For Creators** (apply to join) / **For Brands** (find creators,
launch a campaign) / creator profiles / campaign briefs / creator
matching / performance tracking. At that point training can be
reduced, folded into onboarding, or kept purely internal as a
screening tool — the point of this document is that today's
architecture should be able to bend that way later, not that it should
be built that way now.

### The real asset

The course is not the end asset — **a database of creators whose
abilities we can actually verify** is. Over time the goal is to be
able to answer, with evidence: *"If this creator gets a brief for an
app, can they make a strong video?"* That answerability is what makes
the network valuable to a brand — not follower counts, ability to
produce.

### Business model evolution

Initial: creator pays for training. Eventual: brand pays for a
creator/campaign, we compensate the creator and keep a network margin.
Course revenue funds creator acquisition and qualification early on;
long-term, the business should lean increasingly on brand-campaign
revenue rather than course sales.

### Agency value proposition (once real)

*"We don't just hand you a list of creators — we've already tested
them."* Because the network came out of the qualification pipeline, we
can actually know what a given creator makes, how they perform, what
formats they're strong in, whether they hit deadlines and follow
briefs, and whether their content feels native rather than like an ad.
That evidence is the differentiator, not the roster size.

---

## 17. Hard guardrails

**Messaging, everywhere on the site:**
- Never promise virality, guaranteed views, or guaranteed income.
- Never promise a guaranteed brand deal or guaranteed campaign —
  opportunity is earned, always conditional on demonstrated ability,
  reliability, and actual brand demand at the time.
- Never make virality sound deterministic. The honest version: *"Learn
  the principles behind content that's repeatedly performed. Test your
  own content. Learn from the data. Improve."*
- Never name the specific app/client the real proof videos were made
  for — generic phrasing only.
- Never present reference-material claims (§8) with more confidence
  than their tier supports — an "uncertain/folklore" claim never gets
  taught as settled fact.

**Product/engineering, everywhere:**
- Never invent analytics, student testimonials, or creator statistics.
- Never treat course completion as equivalent to creator ability.
- Never expose paid course videos — or clips cut from them — on any
  public page.
- Never use generic AI-stock-style examples when a real example
  exists; a real example beats an invented one every time.
- Never let the brand collapse back into "the faceless content
  course" — that's a smaller, already-superseded idea.
- Never assume the current curriculum structure is final — §11 already
  isn't, and won't be the last revision either.
- Never build the agency layer prematurely into the public site.
- Never expose the leaderboard, rankings, or any competitor's identity
  before purchase.
- Never make the public landing page read like a social network.

---

## 18. Implementation priorities

**Now**, roughly in order: keep the real high-performing content
(Knowledge Base A) accurate and growing as more confirmed examples come
in; keep extracting/naming the recurring mechanisms from it; keep the
training experience (Knowledge Base B) strong and grounded in those
mechanics; keep the public curriculum text-only; keep paid lesson
content off the public site entirely — all of which the current build
already does (§19). Resolve the video-analysis tooling question (§7)
before treating deep frame-level analysis, or reference-to-real-content
pattern claims (§9, §11), as available.

**Also near-term:** implement curriculum architecture v2 (§11) in
`curriculum.ts` once the id-stability question (§19) is deliberately
decided, not as a quick edit — it touches live progress data for any
already-enrolled account.

**Later, once the paid lesson videos exist:** analyze them (§10),
rewrite lesson/module copy from what they actually contain, wire
deliverables to the lessons they follow from, keep the footage behind
the paywall throughout.

**Eventually:** build the post-purchase leaderboard/evaluation/
deliverable system (§14), build toward a real pool of verified
creators, use that pool to stand up the agency layer (§16).

Every feature question should resolve to: *does this help train,
evaluate, verify, or eventually deploy creators?* If not, question
whether it's needed yet.

---

## 19. Current codebase vs. this vision

A snapshot, not a rebuild list — nothing here gets auto-implemented.

**Already matches this vision:**
- Knowledge Base A / B split is real and documented in code
  (`proof-content.ts` header, `curriculum.ts` header) — not just a
  concept in this doc.
- Public curriculum is text-only; the old module-preview video slot
  was removed from both `curriculum-shelf.tsx` and
  `full-curriculum.tsx`.
- `MODULE_VIDEO_IDS` (paid lesson footage, once it exists) is
  explicitly documented as dashboard-only, never wired into a public
  page.
- The homepage narrative arc (Problem → Belief → Challenge → Proof →
  Breakdown → Training → Practice → Qualification → Opportunity)
  matches §13 already.
- Opportunity/brand-deal copy already reads as earned-possibility, not
  guaranteed, in both marketing copy and dashboard copy (including the
  dashboard's own "You've completed the course" and locked-recruiting
  copy, both tightened in the most recent pass).
- The module `practice` line — the visible "training → you must
  produce" seam — is now shown inside the paid dashboard itself, not
  only the public marketing pages.
- No fabricated stats, testimonials, or ratings remain on the site —
  removed earlier in this project specifically because they didn't
  hold up against this same "never invent numbers" principle.

**Gap between what exists and what this vision describes (Phase 2,
not started):**
- No deliverables/submissions table or storage exists yet — the
  `assignments` table that does exist is for *paid, already-live brand
  campaign work*, not a training deliverable someone submits for
  evaluation.
- No leaderboard, creator score, or evaluation-dimension schema exists.
- No Verified/Performance/Top Creator tier exists — `applicants` has
  no tier field.
- Today's recruiting gate is a single binary flag (100% of
  `profiles.completed_lessons` unlocks `/dashboard/recruiting/*`) —
  the opposite of the graduated, deliverable-based qualification this
  document describes. Matching is entirely manual (an admin picks a
  job from a dropdown), not creator-to-brief matching.
- No brand-facing portal, campaign-brief submission, or creator-
  matching logic exists — Layer 3 in full.
- **Curriculum architecture v2 (§11) is decided but not implemented.**
  `curriculum.ts` still reflects the 8-module/28-lesson structure.
  Implementing it isn't a pure copy-paste: module and lesson ids
  (`m1`, `m1-l1`, etc.) are generated positionally from array order in
  `curriculum.ts`, so inserting a new module at position 1 shifts every
  id after it — which would silently invalidate any already-enrolled
  creator's stored `completed_lessons` progress, since progress is
  keyed by lesson id, not by title. Real implementation needs either
  stable, non-positional ids or an explicit migration step for
  existing progress data, plus a 9th color added to `MODULE_SHADES`
  (currently exactly 8 entries). Worth deciding deliberately, not doing
  as a quick edit.

This gap list is the same one already tracked as "Recommended Phase 2"
in `fancy-sleeping-reef.md` — this document is what that Phase 2 work
should be checked against once it's actually scoped.

**Research complete, not yet acted on:** the MediaMaxxing teardown
(§20) confirmed this same gap list from a second, independent angle —
its single biggest finding (a real submission/review/outcome flow) is
the same deliverables gap listed above, not a new one. One immediate,
schema-free action item came out of it (`CURRENT_PRODUCT_UX_RECOMMENDATIONS.md`'s
"how it works" homepage strip); everything else it surfaced sits in
`FUTURE_AGENCY_BACKLOG.md` pending the same Phase 2 work.

---

## 20. MediaMaxxing: reference-product research

A UX/product-architecture teardown of MediaMaxxing (a mature,
independently-operating creator/UGC marketing platform) was conducted
against this vision, not against our own taste — the goal was
identifying what a platform at that stage eventually needs, then
judging each piece against whether it actually serves *our* creator
qualification pipeline (§17's four questions), not adopting it because
it exists on a funded competitor. Full page-by-page teardown:
`MEDIAMAXXING_UX_RESEARCH.md`. Resulting backlog:
`FUTURE_AGENCY_BACKLOG.md`. Concrete current-product calls:
`CURRENT_PRODUCT_UX_RECOMMENDATIONS.md`.

**Methodology, briefly:** the public site (`/`, `/for-brands`,
`/for-agencies`, `/auth`) was actually screenshotted and analyzed. All
seven authenticated creator-app routes (`campaigns`, `submissions`,
`earnings`, `retainers`, `courses`, `white-label`, `account`) were
confirmed — by checking the real post-navigation redirect, not assumed
— to redirect to `/auth`. Nothing about their contents is invented;
where the research discusses them, it's explicitly labeled as either
MediaMaxxing's own public marketing copy or general domain knowledge
about this category of product, never a description of a page that was
never seen.

**The single most important finding is a contrast, not a pattern to
adopt:** MediaMaxxing's own homepage describes its training as
step-by-step tutorials that show creators how to recreate an
already-proven viral template. Off Camera's training teaches the
transferable mechanics instead (§6, §10) — a deliberate difference,
not a gap this research suggests closing. Their public copy also
promises "guaranteed views" — a direct violation of a guardrail this
project already committed to (§17) — worth naming as confirmation the
guardrail is correct, not a reason to reconsider it.

**What is genuinely useful:** a real submission/review/outcome flow
(the biggest concrete gap this research found — Off Camera's
`assignments` table today only represents an already-live, already-paid
post, not a training deliverable submitted for review, which is
exactly the deliverables gap §19 already flagged, now with a clearer
target shape); a creator card pattern that pairs a tier badge, a trend,
and a specific factual caption — directly applicable to the conceptual
Verified Creator profile in §15, once real deliverable data exists to
populate it; and confirmation that a small, genuinely-limited creator
roster (our 10–12, §1) can be messaged as honest scarcity on a future
brand-facing page, the way MediaMaxxing's waitlist copy does — a
pattern that happens to fit our real constraint rather than dressing up
an artificial one.

### Feature classification (evaluated, not copied from the research prompt's example)

| Feature | MediaMaxxing inspiration | Current need | Action | Future use |
|---|---|---|---|---|
| Deliverable/challenge cards | Campaign discovery & cards | High | **Adapt later** — needs the deliverables table from §19 first | Brand campaign cards, Layer 3 |
| Submission review flow | Submission status states | High | **Adapt later** — same schema dependency | Campaign fulfillment |
| Performance-hero stat card | Success-story earnings cards | Medium | **Adapt later** — hero performance, never dollars, until real revenue exists | Full creator profile, §15 |
| Earnings dashboard | Earnings page | Low now | **Save** | Real payouts once brand-campaign revenue is material |
| Retainers | Recurring creator-brand work | None now | **Save** | Late-stage agency only, §16 |
| Template-replication training model | Step-by-step viral-template tutorials | N/A | **Do not use** — opposite of our actual teaching model, §6/§10 | — |
| Tier badges (Verified/Performance/Top) | Advanced/Intermediate badges | Medium | **Save** — needs real verification data first | §15 |
| "How it works" numbered strip | 01/02/03 step pattern, reused site-wide | Medium | **Implement now** — copy/layout only, no schema | — |
| Dedicated brand/agency pages | `/for-brands`, `/for-agencies` | None now | **Save** | Layer 3 brand portal, §16 |
| White-label reseller product | `/for-agencies` infrastructure offering | None | **Do not use** — different business model, §16 | Revisit only if explicitly requested later, low priority |
| Value-prop repeated at the auth screen | `/auth` right-rail value list | Low | **Do not use as-scoped** — our `/checkout` already does the analogous job; MediaMaxxing's version solves a cold-arrival problem our flow doesn't have | — |

---

## 21. The core message

*"We teach people how to create short-form content that performs, then
give them a real chance to prove they can do it. The strongest
creators can become part of a verified creator network we eventually
take to brands."*

Shorter: **Learn → Create → Prove → Get Opportunities.**

Shortest possible framing of the mistake to avoid: this is not "a
course, and maybe later an agency." It's a **creator qualification
system that currently uses a course as its training layer**, aimed at
a verified creator network and, eventually, an agency. Every product
decision should be checked against that sentence, not the smaller one.
