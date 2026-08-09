# Off Camera — Marketplace Listing Kit

Copy-paste source for listing this course on marketplaces (Whop, Gumroad,
AppSumo, Payhip, Teachable's marketplace, etc). These platforms use their
own listing forms, so this doc is the canonical copy that keeps every
listing consistent with the site and with each other.

Keep this file updated whenever pricing, curriculum, or positioning changes
on the site itself. It's the source of truth other listings get copied from.

---

## Product identity

**Name:** Off Camera
**Full title (for listings that want one):** Off Camera: Faceless Content & Brand Deals
**Category / tags:** Content Creation, Social Media Marketing, UGC, TikTok, Instagram Reels, Creator Economy, Freelancing
**Price:** €17.99, one-time, lifetime access
**Purchase terms:** Final at checkout, no trial window (access unlocks in full immediately). Say this only if a platform's form has a dedicated refund-terms field; don't lead with it.

---

## One-liner (≤ 60 characters)

For fields with tight limits (Whop tagline, browser tab, etc.)

> Go viral without showing your face.

## Short description (≤ 150 characters)

For marketplace search-result cards / meta descriptions.

> Learn to create faceless viral content, land brand deals, and get picked for campaigns, taught from real creator experience.

## Medium description (~300 characters)

For platforms with a subtitle/summary field between the one-liner and the full listing body.

> A hands-on course on creating faceless viral content, pitching brands, and getting picked for paid campaigns, without ever being on camera. 8 modules, 25 lessons, taught by a full-time faceless UGC creator. One-time payment, lifetime access.

---

## Full listing description (long-form)

Use this as the main body copy for Gumroad/AppSumo/Whop-style listing pages that support Markdown or rich text.

```markdown
# Go viral without showing your face.

Hi, I'm Aron. I built a full-time content business without ever putting my
face on camera, and this course is the exact playbook I use, not a theory
class.

If you've ever wanted to get into content creation but didn't want to be
"the face" of your content, this is for you. You'll learn how to create
faceless videos that actually perform, how to pitch brands so they say yes,
and how to keep getting picked for paid campaigns, again and again.

## What you'll learn

- **Find your niche**, without ever showing your face
- **The anatomy of a scroll-stopping hook**: 3-second formulas that keep people watching
- **Film & edit with just your phone**: no gear, no studio, no camera confidence required
- **Trend-jack without looking desperate**
- **Pitch brands and land your first deal**, templates included
- **Build a UGC portfolio** that sells itself
- **Get picked for campaigns**: how agencies and platforms actually choose creators
- **Pricing, contracts & getting paid**: what to charge and how to get paid on time

## What's included

- 8 core modules, 25 lessons (~4.5 hours of content)
- Pitch & contract templates
- Private student community
- Lifetime access + all future updates
- Campaign application checklist

## Who this is for

Anyone who wants to get into content creation, UGC, or brand partnerships
without being the on-camera talent: creators, freelancers, marketers, or
anyone curious about the faceless-content space.

**Price: €17.99, one-time. Lifetime access.**
```

---

## Platform-specific versions

The copy above works everywhere, but each platform rewards a slightly
different shape. Use these instead of the generic version when listing on
that specific platform.

**Outbound link:** whenever a platform lets you add a "visit website" /
"creator link" URL, point it at `${siteConfig.url}/go`, not the homepage.
That page is a stripped-down, single-scroll version of this same offer
built specifically for people who already clicked a link to get there, no
site nav, no browsing, straight to the pitch and the price.

### Whop

Whop is browse-first and community-native: people discover you through
category pages and creator profiles, not just search, and a private
Discord/community is a normal (expected) part of the offer.

- **Category:** list under Education → Content Creation, or Business → Creator Economy if both exist
- **Lean into the community angle** in the first two lines, that's what Whop buyers scan for first
- **Creator profile bio** (shorter than the site's, Whop trims aggressively):
  > Full-time faceless UGC creator. No camera, real brand deals. I teach the exact system in Off Camera.
- **Tagline field:** `Go viral without showing your face.`
- **First line of description** (Whop shows this before the "read more" fold):
  > Learn to create faceless content that brands pay for, plus get access to a private community of students doing the same thing.

### Gumroad

Gumroad is checkout-first: people usually arrive with intent already
(a link from social, not a browse session), so the page can be shorter and
should get to the price and the "buy" button fast.

- **Product name:** `Off Camera: Faceless Content & Brand Deals`
- **Summary** (Gumroad's short field, shown in search/social previews):
  > Go viral without showing your face. 8 modules, 25 lessons, taught by a full-time faceless UGC creator.
- **Lead with the outcome, not the backstory.** Cut the "Hi, I'm Aron" opening for Gumroad specifically, move straight to what's included and the price. Gumroad buyers are already convinced by the time they click through from wherever they found the link; don't re-sell them.
- **Use Gumroad's own "content" preview thumbnails** for the module list instead of re-describing it in prose. Gumroad renders file/content lists natively.

---

## Bullet highlights (for listing pages with a fixed "key features" block)

- 🎯 8 modules, 25 lessons: a complete, structured curriculum
- 📱 No camera, no studio: everything works with just a phone
- 🤝 Real pitch & contract templates, not just theory
- 💬 Private student community included
- ♾️ Lifetime access, including future updates

---

## Suggested FAQ block

Reuse the site's FAQ content directly, see [`src/components/marketing/faq.tsx`](../src/components/marketing/faq.tsx) for the current, canonical version. Keep both in sync when either changes.

---

## About the creator (bio blurb)

**Short (marketplace "seller" bio, ~200 characters):**

> Aron is a full-time faceless UGC creator with 80+ paid brand campaigns. Off Camera is the exact system he uses, taught step by step.

**Longer version (if the platform supports a full creator bio):**

> I'm Aron, a full-time content creator who never shows my face on camera.
> A few years ago I was filming content nobody watched. Then I switched to
> faceless formats and everything changed: brands started reaching out to
> me instead of the other way around. I've since completed 80+ paid brand
> campaigns without ever being on camera, and Off Camera is me walking you
> through the exact steps, the way I wish someone had walked me through it.

---

## Cover / thumbnail image specs

Exact requirements change per platform and over time, always check each
platform's current upload guidelines before submitting. As a safe default
across most marketplaces:

| Asset | Safe default size | Notes |
|---|---|---|
| Cover / banner image | 1200×630 (16:9) | Matches this site's Open Graph image, reuse it as a starting point (`/opengraph-image`) |
| Square logo / icon | 1000×1000 or 512×512 | Use the wordmark + accent dot from the site's `Logo` component as a reference |
| Vertical / story-style thumbnail | 1080×1920 (9:16) | Some marketplaces (Whop) favor vertical cards on mobile |

Brand colors for any exported image assets (from the live site theme):

- Primary (terracotta): `oklch(0.62 0.19 35)`
- Ink (outlines/text): `oklch(0.16 0.012 50)`
- Background (cream): `oklch(0.985 0.008 75)`
- Card: `oklch(1 0.004 75)`

---

## Pre-launch checklist before submitting to any marketplace

- [ ] Replace placeholder legal pages (`/terms`, `/privacy`, `/refund-policy`) with reviewed, real business details
- [ ] Replace `siteConfig.contactEmail` and `siteConfig.url` in `src/lib/site-config.ts` with real values
- [ ] Set up real payment processing (this build's checkout is UI-only/demo, see `src/app/checkout/actions.ts`)
- [ ] Set up real authentication (this build's login accepts any email/password, see `src/lib/auth.ts`)
- [ ] Add real video: set unlisted YouTube ids in `siteConfig.videos` (intro/story) and `MODULE_VIDEO_IDS` in `src/lib/curriculum.ts` (per module) — the player already renders a real embed the moment an id is set, see `VideoPlayer`'s `youtubeId` prop
- [ ] Add a real community: set `siteConfig.communityUrl` to a real Discord/Circle/Skool invite once one exists
- [ ] Connect a real email service provider: `src/lib/leads.ts` currently appends captured emails (newsletter signups + abandoned checkout emails) to a local `data/leads.jsonl` file, swap `saveLead` for a real ESP/CRM API call before going live
- [ ] Swap AI-generated/illustrative testimonials and stats for real, verifiable ones before adding review/rating structured data
- [ ] Confirm pricing and currency match across the site, this doc, and every marketplace listing
