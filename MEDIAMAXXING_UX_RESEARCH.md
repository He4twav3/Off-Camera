# MediaMaxxing — UX & Product Architecture Research

> Reference-product teardown, not a spec to copy. **Correction:** an
> earlier version of this line called MediaMaxxing "a mature, funded
> platform" — a follow-up web search found no evidence of that and it
> was inaccurate to assert. What it actually appears to be, per public
> sources (see "Company background" below): a fast-growing, likely
> bootstrapped operation that launched as a Whop clipping community in
> February 2025 and built out into the fuller three-sided web platform
> screenshotted here. Studied regardless, for information architecture,
> workflow, and motivation mechanics — a platform's polish and
> usefulness as a reference don't depend on its funding status. Nothing
> in this document is a claim about what *should* exist in Off Camera
> today; that judgment lives in `CURRENT_PRODUCT_UX_RECOMMENDATIONS.md`.
> Long-term architecture ideas live in `FUTURE_AGENCY_BACKLOG.md`. Both
> were written directly from this research and cross-reference it
> rather than repeating it.

## Company background (separate from the UX teardown)

Sourced from public web search, not the product itself — confidence
noted per claim, nothing here is verified beyond what's cited.

- **Founder:** goes by "Sonny" (online handle "sonnythe0ne," LinkedIn
  "Sonny Morse" / "Sonny M."). Self-reported on LinkedIn: generated
  45.6M+ organic short-form views for brands including Lovable, Kimi
  (Moonshot AI), and OFFERGOBLIN, doing UGC/clipping as a side hustle
  "with no team, no brand, and no long-term goal" before MediaMaxxing —
  age (17) is self-reported, not independently verified.
- **Origin story, per Sonny's own account:** he was noticed in a
  "Social Media Growth" Discord server by someone who turned out to be
  an established operator with multiple SaaS/e-commerce/coaching brands
  already built — that connection led to MediaMaxxing getting built out
  "in just a few months." Sources disagree on the exact co-founding
  team — a RocketReach org-chart listing names Alexandros Lekkas
  (Founding Engineer) and Josiah Alvarado (Director of Operations),
  while another summary of Sonny's own LinkedIn names Davin Patel and
  Jose Maldonado instead — flagged as an inconsistency across secondary
  sources, not resolved here.
- **Launch:** February 2025, as "Media Maxxing: Clips + UGC," a
  Whop-hosted clipping community (free to join, 30% affiliate
  commission for referrals, a paid upsell tier) — the same genre as
  dozens of other Discord/Whop clipping communities, not a category
  MediaMaxxing created. Its first onboarded brand is reported to have
  been Lovable.
- **Scale, as far as verifiable:** a third-party Whop analytics
  tracker (whoptrends.com, an outside estimator, not a disclosed
  figure) puts that specific Whop community at roughly $15,400 total
  revenue and ~2,100 active members — modest. What visibly did grow is
  the standalone `mediamaxxing.com` product this teardown actually
  studied — a considerably more built-out platform (creator/brand/
  agency-segmented pages, matching, its own auth flow) than a Whop
  community listing, consistent with a small team having been built out
  to ship it, though no confirmed timeline or funding source for that
  step was found.
- **No evidence of institutional/VC funding was found** — the
  "bootstrapped, grew out of one person's own UGC results" reading fits
  the available evidence better than "funded startup," but this isn't
  confirmed either way beyond what's cited above.

Sources: [LinkedIn — Sonny M.](https://www.linkedin.com/in/sonnymorse/), [RocketReach — MediaMaxxing management](https://rocketreach.co/mediamaxxing-management_b689f057c981d3bd), [Whop — MediaMaxxing listing](https://whop.com/stoic-ai-faceless-rpm-deals/media-maxxing-clips-ugc/), [WhopTrends — revenue/stats](https://whoptrends.com/products/media-maxxing-clips-ugc), [Digiday — "WTF is clipping?"](https://digiday.com/media/wtf-is-clipping-the-low-lift-creator-strategy-grabbing-advertisers-attention/)

### The cold-start sequence — how brand trust and creator supply actually bootstrapped

A natural question: a pay-per-view platform needs creators to attract
brands, but needs brand budgets to make creators worth joining for —
so which came first? Per the sources above, **neither, in the usual
sense — the founder's own personal track record substituted for both.**
Sonny had already generated real, provable results (part of that
45.6M+ view figure) for Lovable *as a solo creator, before MediaMaxxing
existed as a platform at all*. Lovable was reportedly the first brand
onboarded once the platform launched, and Lovable itself went on to
become a widely-covered breakout success (reported outside funding led
by Accel, rapid revenue growth, a high valuation) — which retroactively
made that original case study far more credible than it looked at the
time it was made.

That one proof point, plus Sonny's pre-existing credibility/network in
the clipping and UGC community, is what let the platform launch as a
free, low-barrier Whop community with a built-in referral incentive
(30% affiliate commission for anyone who brought in new creators) — a
structure that grows creator supply on its own, without needing brand
budgets to fund every new signup. Reported (company-stated, not
independently audited) traction figures: $1M+ paid out to creators
total, 2,800+ creators who've earned something, monthly payouts growing
roughly 3x month over month.

**The sequence, best-supported reading:** founder's own solo proof →
that proof funds/attracts the first real brand budget → the free,
referral-driven community structure grows creator supply against that
credibility, not against a pool of creators that had to exist first.
Not "creators, then brand trust" — one person's real result, then both
sides at once.
>
> **We are not building MediaMaxxing.** Their business model (creators
> post on their own accounts using MediaMaxxing's viral templates for
> whichever brand campaign they pick, paid per view) is meaningfully
> different from ours (train creators on transferable mechanics, then
> qualify a small verified roster we personally vouch for to brands).
> Several of their strongest patterns are still worth learning from —
> that's what this document is for.

## Methodology — what was actually inspected

Real headless-browser screenshots, desktop (1440px) and mobile (390px)
where relevant, taken directly against the live site on 2026-08-24 —
not a memory of the product, not assumed content.

**Actually accessible (screenshotted, analyzed below):**
`/` (home), `/for-brands`, `/for-agencies`, `/auth`.

**Confirmed authenticated — every single one redirected to `/auth`
when visited directly, verified by checking the post-navigation URL,
not assumed:**
`/creator`, `/creator/campaigns`, `/creator/submissions`,
`/creator/earnings`, `/creator/retainers`, `/creator/courses`,
`/creator/white-label`, `/creator/account`.

Per the instruction this research was scoped under: nothing about the
inside of those seven routes is invented. Where this document discusses
what they likely contain, it is explicitly labeled as either (a) a
direct quote/paraphrase of MediaMaxxing's own public marketing copy
describing that feature, or (b) general UGC/creator-platform domain
knowledge, not something observed on MediaMaxxing specifically. Every
such instance is marked inline.

---

## Page-by-page teardown

### Home (`/`)

**Visual UX.** Dark navy/near-black theme throughout the whole site (no
light mode observed anywhere), one accent blue for links/buttons/stat
numbers, an italicized serif display face used only for emphasis words
inside otherwise sans-serif headlines ("*Get Paid*", "*real income*",
"*viral templates*") — a specific, consistent typographic device: the
serif italic is reserved for the single word that's doing the emotional
work in a sentence, sans-serif carries everything else. Generous
vertical whitespace between sections; no persistent chrome below the
header (no sticky sidebar, no bottom nav — a pure marketing scroll).

**Structure, top to bottom:**
1. Header — logo, "For Creators / For Brands / For Agencies / Careers
   / Blog" nav, "Sign In" (text) + "Get Started" (filled pill button).
2. Hero — "Create Content & *Get Paid* Per View," one-line subhead,
   two CTAs ("Start Creating" primary, "For Brands" secondary/outline).
3. "How it works" — three numbered steps, each a large italic serif
   numeral (01/02/03) over a short bold title and one-sentence
   description: *Browse Campaigns → Create Content → Earn Per View.*
4. "Success Stories" — real (their claim) creator earnings cards, see
   below — the most substantial section on the page.
5. Blog teaser — three latest post cards + "View All."
6. Footer — logo/tagline, two link columns (Platform / Company), one
   copyright line.

**The success-story cards, in detail (the single most reusable pattern
on the site):** each card pairs a creator's first name + handle with a
large dollar figure in the accent color, a small tier badge
("Advanced" / "Intermediate"), a small embedded line chart of their
earnings over time, a phone-frame mockup of their actual content grid,
a compact stat line in caps ("17 ACCOUNTS · 5,900 POSTS · 50/DAY"), and
a one-sentence caption that states a *specific, concrete* achievement
("Scaled a 17-account content machine to over 5,900 posts in under 4
months, turning MediaMaxxing into a consistent $800+/day engine") —
never a vague testimonial quote. The copy above the grid explicitly
frames these as real: *"Real dashboards, real accounts. Every number
below is a screenshot from the creator's own earnings page."*

**Interaction UX.** Primary action throughout is unambiguous: *start
creating.* Secondary path (For Brands) is offered but visually
subordinate everywhere. The success-story cards are stated to be
clickable through to a full real screenshot — proof-of-realness as an
explicit, named feature, not just an implicit design choice.

### `/for-brands`

Same visual system, brand-facing copy: *"Drive Growth with Authentic
Content."* A four-step "how it works" (Join the Waitlist → Get Matched
with Creators → Content Goes Viral → Pay Per View & Scale) — brand
onboarding is waitlist-gated, not instant signup, unlike the creator
side. Two stat cards ("100M+ average views per brand," "30k+ active
creators") in the same large-serif-numeral style as the home hero's
step numbers — the numeral treatment is a reusable stat-display
component, not a one-off. Closes on an explicit scarcity CTA: *"Spots
are limited. Get in line" / "We onboard a handful of new brands at a
time."*

### `/for-agencies`

A third, structurally distinct audience: **this is not "MediaMaxxing
runs an agency," it's "run your own agency on top of MediaMaxxing's
infrastructure."** Headline *"Run Your Own Agency,"* three-step flow
(Join the Waitlist → Set Up & Launch → Grow & Earn), three value cards
each keyed to a single blunt stat-as-headline: *"0 — Setup Required"*
(infrastructure/tracking/payouts already built), *"Live — Real-Time
Analytics,"* *"100% — Payouts Handled For You."* Same waitlist scarcity
close as the brands page.

**This is a different business model from ours, worth naming
explicitly** — MediaMaxxing's agency layer is a B2B2C reseller model
(a third party's own agency, running on MediaMaxxing's rails, with
MediaMaxxing's creator pool). Off Camera's Layer 3 plan
(`PRODUCT_VISION.md` §16) is us *being* the agency, with our own
directly-trained, directly-verified creators — not licensing
infrastructure to other agencies. The "0 setup required" pitch doesn't
transfer; the underlying idea that a mature creator platform can
support more than one kind of paying customer (creator, brand,
possibly a third operator layer) is the actual transferable insight,
not the specific white-label product.

### `/auth`

Single unified login for every account type (email or Google, no
creator/brand role picker at the auth step itself — role is presumably
determined by which top-level flow you arrived from, or set post-auth,
neither of which is inspectable). The right-hand panel restates the
core value prop one more time, right at the point of highest intent:
*Post Right Away → Earn by Performance → Track Performance → Auto
Payouts,* each with its own icon. Worth noting as a micro-pattern: the
pitch doesn't stop once someone clicks "Get Started" — it's repeated,
compressed to four words each, exactly where someone is about to commit.

### The seven `/creator/*` app routes

**AUTHENTICATED — NOT CURRENTLY INSPECTABLE**, every one, confirmed by
redirect to `/auth` on direct navigation (not assumed from a marketing
page listing them). No credentials for a logged-in account exist in
this environment, and none were requested or invented. Everything
below in the numbered sections keeps this boundary explicit — labeled
observations from MediaMaxxing's own public copy versus labeled general
domain knowledge, never a description of what's actually on the page.

---

## 1. What MediaMaxxing is doing well

- A single, obvious primary action on every page (start creating / join
  the waitlist / earn per view) — no split attention.
- Proof that's *specific*, not just present — real names, real handles,
  exact dollar figures, exact post counts, exact timeframes. "Scaled to
  5,900 posts in under 4 months" persuades in a way "thousands of happy
  creators" never does.
- One visual system serving three genuinely different audiences
  (creator/brand/agency) without forking the brand — same typography,
  same numbered-step pattern, same stat-card component, different copy.
- Repeating the value proposition at the moment of commitment (the
  auth-page value list), not only earlier in the funnel.

## 2. Useful UX patterns

- **Numbered-step flow** (large italic-serif numeral + bold title + one
  sentence) for "how it works," reused identically across all three
  audience pages. Off Camera already has a version of this — the
  "system flow" pipeline strip on `/course` (`full-curriculum.tsx`) —
  this validates the pattern rather than introducing a new one.
- **Stat-as-headline cards** (a huge number *is* the headline, label
  underneath explains what it counts) used for both social proof
  (success stories) and trust-building aggregate stats (100M+ views,
  30k+ creators). Simple, and reads in under a second.
- **Value-prop repetition at the conversion moment**, not just on the
  landing page.

## 3. Useful information architecture

- Three separate top-level audience destinations (`/`, `/for-brands`,
  `/for-agencies`) rather than one page trying to speak to everyone —
  relevant *once Off Camera has a brand-facing surface to speak to*
  (Layer 3, not yet). Until then, a second audience page would have no
  one to address and shouldn't exist.
- Waitlist gating as a structural device on the brand/agency side, not
  just marketing copy — "spots are limited" is backed by an actual
  application step before access, not just a claim next to an open
  signup button.

## 4. Useful creator workflows

Publicly stated, not observed inside the app: campaigns are
browsed → a template/tutorial shows exactly how to recreate an
already-proven video → the creator posts → views convert to pay
automatically. The whole loop is designed to require no original
creative decision-making from the creator — the opposite end of the
spectrum from Off Camera's actual teaching goal (see §12, "things we
should NOT copy").

## 5. Useful motivation/retention mechanics

- **Named tiers visible on a public-facing card** ("Advanced,"
  "Intermediate") — a lightweight status signal shown to the outside
  world, not just an internal number. Directly relevant to the
  Verified/Performance/Top Creator tiering `PRODUCT_VISION.md` §15
  already describes conceptually — MediaMaxxing's version shows what
  that tier looks like rendered on a real card, not just in a spec.
- **A visible trend line, not just a total** — the small earnings chart
  on each success-story card implies "this is still climbing," which a
  static total number doesn't communicate.
- Scarcity used honestly-adjacent to how it would need to work for us:
  "we onboard a handful at a time" is a real supply constraint they're
  choosing to message as exclusivity. Off Camera's actual constraint
  (10–12 verified creators, `PRODUCT_VISION.md` §1) is a genuinely
  similar shape — small, deliberately limited, not infinite scale —
  worth remembering when that page eventually gets built: the scarcity
  framing would be *true* for us, not just a marketing device.

## 6. Useful campaign mechanics

**Authenticated — not inspectable.** Publicly stated: campaigns are
"available brand campaigns with ready-to-use viral templates designed
for guaranteed views" (their words — flagged below in §12 as a
guardrail violation for us specifically, not a pattern to adopt as
worded). General domain knowledge (not MediaMaxxing-specific): mature
campaign-discovery UIs typically show a card grid with brand/product,
compensation model, deadline, a saved/applied state, and a filter bar
(platform, payout type, category) — this shape already exists in Off
Camera's own `dashboard/recruiting/jobs` route today, built independently
of this research. Nothing here suggests changing that.

The genuinely useful transfer for *us* isn't the campaign browsing UI —
it's reframing the same card/filter/apply shape around **training
challenges instead of brand briefs**, exactly as `PRODUCT_VISION.md`
§14 already proposes (deliverables like "create three hook variations,"
"create a silent product demo"). MediaMaxxing's campaign cards are the
closest real-world visual analog to what a deliverable card should look
like once that system exists — see `FUTURE_AGENCY_BACKLOG.md`.

## 7. Useful submission mechanics

**Authenticated — not inspectable.** No public copy describes this
page's contents at all, so nothing here is even a labeled inference —
this section is general domain knowledge only. A mature submission flow
in this category typically separates the *submission* (content link,
platform, caption/notes) from its *status* (pending review / approved /
revision requested / rejected / published) and its *outcome*
(performance once live). That three-part shape — submit, review status,
outcome — maps directly onto what `PRODUCT_VISION.md` §14 already calls
out as the biggest current gap: Off Camera's `assignments` table today
only represents the *outcome* stage (an already-live, already-picked
post), with nothing for a creator submitting a training deliverable for
review beforehand. This is the single highest-leverage gap identified
across this whole research pass — see `FUTURE_AGENCY_BACKLOG.md`,
Campaigns section.

## 8. Useful earnings/performance mechanics

**Authenticated — not inspectable**, but the home page's success-story
cards (§ above) are themselves screenshots claimed to be pulled from
this exact page, which makes them a legitimate, labeled, public data
point about its content: revenue total, a trend chart, and an account
grid, at minimum.

The important adaptation for us, not a copy: MediaMaxxing's hero number
is a **dollar figure**, because their creators have real, live,
per-view earnings from day one. Off Camera does not have that yet — no
brand-campaign revenue flows through the training product today. Per
the instruction this research was scoped under, the first version of
an equivalent for us should hero **performance**, not earnings:
lessons/deliverables completed, total views on published practice
content, best video, progress toward verification — the same
card *shape* (big number, small trend, short factual caption, tier
badge), different hero metric. Building a dollar-figure version now,
with no real revenue behind it, would be exactly the fabricated-numbers
problem `PRODUCT_VISION.md` already rules out everywhere else.

## 9. Useful creator profile mechanics

**Authenticated — not inspectable.** The visible tier badge and format
list on the success-story cards are the only public signal. General
domain knowledge: mature creator-platform profiles typically combine
identity (name/handle/avatar), connected social accounts, a niche/
category tag, a capability summary, and a performance history. This
maps almost exactly onto the conceptual Verified Creator profile
`PRODUCT_VISION.md` §15 already sketches (formats, capabilities,
deliverables, views) — this research doesn't change that shape, it
confirms it resembles what a real product in this category actually
ships.

## 10. Useful course/training mechanics

**Authenticated — not inspectable**, but publicly described in one
sentence on the homepage: *"Follow step-by-step tutorials that show you
exactly how to recreate already-viral videos. No experience needed."*

This is the most important finding in the entire teardown, and it's a
**contrast, not a pattern to adopt**: MediaMaxxing's training teaches
creators to *replicate a specific proven template* for a specific
campaign. Off Camera's training teaches the *transferable mechanics*
(hook, retention, format, etc. — `PRODUCT_VISION.md` §6, §10) so a
creator can construct an original hook themselves, for any product, not
just recreate one that already worked. That's a deliberate, existing
differentiation, not a gap — this research confirms it's worth keeping,
not something to soften toward "give people templates to copy."

## 11. Useful brand/agency mechanics

Covered in the `/for-brands` and `/for-agencies` teardowns above. The
transferable piece is structural (a dedicated page per audience, once
that audience actually exists to address) — see
`FUTURE_AGENCY_BACKLOG.md`, Agency section.

## 12. Things we should NOT copy

- **"Guaranteed views."** MediaMaxxing's own public homepage copy says
  their templates are "designed for guaranteed views." This directly
  violates a guardrail Off Camera has already deliberately committed to
  (`PRODUCT_VISION.md` §17: "never promise virality, guaranteed views").
  Worth naming explicitly rather than silently avoiding — a reference
  product doing this is not a reason to reconsider the guardrail.
- **Template-replication as the training model.** See §10 above — this
  is the one place MediaMaxxing's actual product philosophy runs
  opposite to ours, not just differently scoped.
- **Dollar-figure hero metrics before there's real revenue behind
  them.** See §8.
- **The white-label reseller business model.** Not a bad idea on its
  own terms, just not our long-term direction (`PRODUCT_VISION.md`
  §16) — we're building one agency with our own trained creators, not
  licensing infrastructure to other agencies. Keep as a labeled,
  unlikely-to-pursue idea in `FUTURE_AGENCY_BACKLOG.md`, nothing more.
- **Brand identity, copywriting, exact layouts, or any of their actual
  screenshots/claims/testimonials** — not reused anywhere, per the
  instruction this research was scoped under.

## 13. Things to implement now

Low-effort, no-new-schema items grounded in what's real today — the
full reasoning and MUST/SHOULD/NICE breakdown lives in
`CURRENT_PRODUCT_UX_RECOMMENDATIONS.md`, this is the pointer list:
- Repeat the core value proposition once more at the conversion moment
  (checkout/login), the way MediaMaxxing's `/auth` page does — cheap,
  proven, no schema.
- Nothing else from this research clears the bar for "implement now"
  without new schema — most of what's genuinely useful (deliverable
  cards, performance-hero stat cards, tier badges) depends on the
  submissions/deliverables system that doesn't exist yet (§7, §14).

## 14. Things to implement later

- A deliverable/challenge card modeled on MediaMaxxing's campaign card
  shape (brief, deadline, status, apply/submit action), populated with
  training deliverables instead of brand briefs.
- A submission flow with the three-part shape from §7 (submit → review
  status → outcome).
- A performance-hero version of MediaMaxxing's success-story card
  (§8), shown once a creator has real practice-content performance to
  display.
- Full detail in `FUTURE_AGENCY_BACKLOG.md`.

## 15. Future agency infrastructure

A dedicated `/for-brands`-equivalent page, built only once Layer 3
(`PRODUCT_VISION.md` §16) is real — waitlist-gated the same honest way,
since our actual creator supply (10–12 verified people) is a genuine
constraint, not a manufactured one. Full detail, including the
white-label idea kept strictly as a "maybe, much later" note, in
`FUTURE_AGENCY_BACKLOG.md`.

## 16. Product ideas inspired by the research

- A **tier badge** ("Verified," or eventually "Performance"/"Top") as a
  small, reusable visual component — not just a database column — since
  MediaMaxxing's cards show how much a tier badge alone communicates
  status at a glance.
- A **trend, not just a total** — wherever Off Camera eventually shows
  a creator's performance number, pair it with a small trend indicator
  rather than a static figure, once there's more than one data point to
  trend from.
- **Specific, factual captions over adjectives** — when real deliverable
  outcomes exist, describe them the way MediaMaxxing's cards do
  ("17 accounts, 5,900 posts, 4 months"), never a generic "great
  results!" line. This is really just the site's existing
  "never invent a vague claim when a specific real one is available"
  principle, confirmed by seeing it work well elsewhere.
