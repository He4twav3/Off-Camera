import type { PostTerms } from "@/lib/post-terms";

/**
 * A campaign's whole setup, signed off and written into the code: the brief, the brand note, the example videos, the
 * product guide, the scripts and the pay terms. An admin applies it to the live campaign in one step from the
 * campaign's admin page, which replaces what is saved there. Pure, so the admin action and the tests share it.
 */
export type CampaignPreset = {
  key: string;
  /** Raise it after changing the setup: the live campaign is then updated to it on the next server start. */
  version: number;
  label: string;
  /** Which campaigns it is meant for, matched on the title or the brand note. */
  matches: (job: { title: string; about: string | null }) => boolean;
  about: string;
  /** The brief on the campaign page: "## " starts a step, the lines under it are its text. */
  description: string;
  /** Left out: the campaign keeps the example videos it has. */
  exampleUrls?: string[];
  guide: string;
  scripts: string;
  /** True: creators apply with a sample video, and an admin approves them onto the campaign. */
  sampleRequired?: boolean;
  /** What the sample video should show, under the sample link on the application form. Left out with sampleRequired. */
  sampleCriteria?: string | null;
  /**
   * Everything but who reviews posts and the brand's signed contract, which are kept as they are. Left out: the
   * campaign keeps the pay terms it has (and the brand's agreement to them).
   */
  postTerms?: Omit<PostTerms, "reviewer" | "contract">;
  /**
   * Parts the owner explicitly asked to change in this version, written even if they were edited by hand
   * (lib/apply-campaign-presets.ts). Only for that one version: every other part, and every later version, keeps
   * hand edits.
   */
  requested?: { version: number; parts: string[] };
};

export const MEPERSONA: CampaignPreset = {
  key: "mepersona",
  version: 21,
  // 2026-11-02: each script ends on the creator's partner link and its discount (lib/affiliate-programs.ts). 2026-10-28:
  // the owner raised the pay on the first 10K views (more for the 1K–10K views most creators get).
  requested: { version: 20, parts: ["pay"] },
  label: "MePersona",
  matches: (job) =>
    `${job.title} ${job.about ?? ""}`.toLowerCase().includes("mepersona"),
  about:
    "Answer every comment, in your own voice. MePersona is an AI inbox for creators. It brings your post comments and DMs from Instagram, Facebook, YouTube and more into one place, drafts replies that sound like you, and schedules your posts across platforms. Answering every comment keeps the conversation going, and MePersona makes that possible without living in your apps all day.",
  description:
    "## Read the full brief\nIt explains what MePersona is and what it does, and has scripts you can use.\n## Pick a script and make it your own\nWatch its example video below. Keep the example's hook and structure, then fill it with your own setup, your own platforms and your own real results, built around MePersona.\n## Your own ideas are welcome\nUnique videos and new formats that work are welcome too, and rewarded if they go viral.\n## Use MePersona for a few days first\nSo what you show on screen is real: your inbox, your drafted replies, your scheduled posts.\n## Get paid monthly\nOne statement a month for everything you earned, paid within 7 days.\n### Hooks you can use\n- \"Why aren't more people batching?\"\n- \"Why is your engagement so low?\"\n- \"Small creators, stop doing everything manually.\"\n- \"This feels illegal to know.\"\n- \"Why posting on one platform is holding you back.\"\n- \"Stop relying on one platform to grow. Here's why.\"",
  exampleUrls: [
    "https://www.tiktok.com/@dawn_flaherty/video/7595217979986529567",
    "https://www.tiktok.com/@sabrina_ramonov/video/7618606049490111758",
    "https://www.tiktok.com/@creators_growth_studio/video/7555584924158479630",
    "https://www.instagram.com/reel/DdcVV3zvI6i/",
  ],
  guide:
    "## What MePersona is\n**MePersona is an AI assistant that runs your social media in your voice.** You connect your social media accounts to it, and it helps you reply to people, write your posts and keep everything organized in one place. It learns how you talk, so everything it writes sounds like you, not a bot.\n\n## It learns your voice\nYou read a short sample out loud, and MePersona learns how you talk and write. You can also start from a ready-made persona or build one from scratch.\n\n## You connect your social media\nYou link your accounts to MePersona. Your comments and messages come into MePersona, and your posts go out from it, so you don't jump between apps.\n\n## It replies to your comments and messages\nWhen someone comments or sends you a DM, MePersona drafts a reply in your voice. Your followers still get a personal answer, without you staying on top of every single comment.\n\n## You stay in control\nNothing goes out until you approve it. Every reply and post waits in your Review Queue, where you approve, edit or skip it. Once you trust it, you can turn on auto-reply for simple, routine messages.\n\n## It writes and schedules your posts\nGive it one idea, and it drafts the script or caption for each platform in your voice. Approve it, schedule it, and it posts for you.\n\n## Everything in one place\n- All your comments and DMs from every platform in one inbox (paid plans)\n- A content vault that stores and auto-tags your videos and images\n- An analytics dashboard and a Marketing Agent that plans campaigns in your voice (paid plans)\n- English, Spanish and Traditional Chinese\n\n## Platforms\n! TikTok, X, Pinterest, LinkedIn and Bluesky: MePersona connects to these and can post and schedule for you. It does not reply to comments or DMs on them. Never say it does.\n**Replying to comments and messages works on:** Instagram, Facebook, YouTube, Discord, Telegram, WordPress and Mastodon. You can mention these for everything: replies, DMs, posting and scheduling.\n\nComing soon, so don't mention yet: LinkedIn Pages, Reddit, Twitch and WhatsApp.\n\n## What it costs\n- **Free:** no card needed. About 300 replies a month and 2 platforms.\n- **Premium, $29/month:** unlimited platforms, the all-in-one inbox and analytics.\n- Bigger plans exist for larger accounts. Paid plans have a 7-day free trial.",
  scripts:
    "Use these hooks or similar ones. Make the viral formats your own, built around MePersona: keep the example's hook and structure, then fill it with your own setup, your own platforms and your own real results. Use MePersona for a few days before filming, so the proof shots are real.\n\n## Which account to use\n**Post these videos on your own account, not a new or separate one.**\nMePersona is made for content creators, and the people who follow you are creators too. They're exactly who these videos are for, so your own account is where they work.\n\n### 1. GOOD BETTER BEST\n- On screen: three options in a row, labelled GOOD, BETTER and BEST.\n- Hook: \"Let's rate the ways to keep up with your comments and posts.\"\n- \"Good: doing it all yourself in every app. It works, until you're on three platforms.\"\n- \"Better: a post scheduler. Your posts go out on time, but your comments and DMs still pile up.\"\n- \"Best: MePersona. It schedules my posts and drafts replies to my comments and DMs in my voice, all in one place. I just approve.\"\n- \"One place, less work, more time to create.\"\n- End: \"Use my link in bio for 20% off your first 3 months.\"\n\n### 2. Why aren't more people batching?\n- Label: \"write once, post everywhere\"\n- Hook: \"Why aren't more creators doing this? You want to post consistently without it eating your whole week, right?\"\n- \"Here's the part people skip: write once, post everywhere, in your own voice.\"\n- Background: one idea turning into a video script, a caption and a version for another platform.\n- [PROOF] Your posting calendar, with the week filled in.\n- End: \"Nothing goes out until I approve it. Use my link in bio for 20% off your first 3 months.\"\n\n### 3. Be on every platform without living on every platform\n- Title box: \"How I'm on 8 platforms as a small creator\" / red line: \"(without being online all day)\"\n- Hook: \"If you're a new creator and you're only on one platform, you're making it harder for yourself.\"\n- \"Every platform is a new place for people to find you. The problem is you can't be in eight apps all day.\"\n- \"So I use MePersona. My videos go out to TikTok and Pinterest, and comments and messages on Instagram, YouTube, Facebook and Discord get replies drafted in my voice.\"\n- [PROOF] Your connected platforms screen.\n- \"I check in once a day, approve, and I'm done.\"\n- End: \"Use my link in bio for 20% off your first 3 months, plus a 7-day free trial.\"\n\n### 4. Why your engagement is low (small creators)\n- Title box: \"Small creators: why your engagement is low\" / red line: \"(it's not the algorithm)\"\n- Hook: \"Small creators, if your engagement is low, it might be one thing. You're not replying.\"\n- \"When you're small, every comment counts. Someone comments, gets no answer, and doesn't bother next time.\"\n- \"Big accounts can afford to ignore comments. You can't. Those first few hundred people are the ones who show up for every video.\"\n- \"I used to leave comments sitting for days, because I was filming, editing and working at the same time.\" (only if true)\n- \"Now MePersona drafts the replies in my voice, and I approve them in a few minutes.\"\n- [PROOF] Your comment section with your replies.\n- End: \"Use my link in bio for 20% off your first 3 months, plus a 7-day free trial.\"\n\n### 5. This feels illegal to know\n- Hook, to camera: \"This AI tool feels illegal to know as a creator.\"\n- \"It answers your comments and DMs in your own voice. Let me show you in under 40 seconds.\"\n- Screen: \"Make a free account, no card. Pick a persona, build one, or read a short sample out loud so it learns how you talk.\"\n- \"Connect your accounts. Now every comment gets a reply drafted in your voice. You tap approve.\"\n- [PROOF] End on your real reply count or a busy comment section.\n- End: \"Use my link in bio for 20% off your first 3 months, plus a 7-day free trial.\"",
  sampleRequired: true,
  sampleCriteria:
    "Send a short sample video. Follow one of our example formats, or try your own idea for a format that would work for MePersona. Use the free plan to film a quick demo, record a talking-head video, or get creative in your own way.",
  postTerms: {
    v: 2,
    // $5 for each unique video; the same video on another platform earns view pay only.
    basePerPost: 5,
    cycleSize: 1,
    repostsEarnBase: false,
    // $4 per 1,000 views for the first 10K, then $2 per 1,000 up to 100K, plus the highest reward a video reaches.
    cpm: [
      { from: 0, rate: 4 },
      { from: 10_000, rate: 2 },
    ],
    cpmCap: 100_000,
    milestones: [
      { views: 250_000, amount: 100 },
      { views: 500_000, amount: 300 },
      { views: 1_000_000, amount: 500 },
    ],
    windowDays: 30,
    keepPublicDays: 0,
    platforms: ["tiktok", "instagram", "youtube_shorts"],
    // One statement a month, paid within 7 days.
    statementEvery: "month",
    dueDays: 7,
  },
};

export const GETIMG: CampaignPreset = {
  key: "getimg",
  version: 4,
  // 2026-11-06: the owner set new pay ($10 a video, $3 CPM from 1K to 100K, rewards up to $750 a video, 7 videos a
  // week), put it in the brief, and added creative freedom for creators' own ideas.
  // 2026-11-06 (v3): the owner asked to replace every old example video and hook with the current formats in the
  // AI video and image generator niche (no-yapping, wait-for-it, one photo to commercial, recreate, reaction + demo).
  // 2026-11-06 (v4): the owner wants every example and script to show a product demo, not just the result
  // (no-yapping split screen, reaction hook + demo, as in the Eromify and Amboras campaigns).
  requested: { version: 4, parts: ["description", "scripts", "examples"] },
  label: "Getimg",
  matches: (job) => job.title.trim().toLowerCase().startsWith("getimg"),
  about:
    "Getimg is one AI studio for images, video, music and speech. You describe what you want, and it picks the best AI model for the job and improves your prompt. Getimg is looking for creators who can turn a simple feature into a strong ad hook.",
  description: [
    "## Read the full brief",
    "It explains what Getimg is and what it does, and has scripts you can use.",
    "## Pick a script and make it your own",
    "Show the result on screen. The output is what sells it.",
    "## Creative freedom",
    "You have full creative freedom. Bring your own innovative video ideas and new formats: the scripts are a starting point, not a rule. Unique videos that work are rewarded if they go viral.",
    "## Use Getimg before you film",
    "Make a few things first, so you know what to show.",
    "## How you get paid",
    "- $10 for every unique video",
    "- $3 per 1,000 views, from 1K to 100K views",
    "- Rewards of $250 at 250K views, $350 at 500K and $750 at 1M (the highest one reached counts)",
    "- Up to $750 per video",
    "- 7 videos a week on TikTok, Instagram Reels or YouTube Shorts",
    "### Hooks you can use",
    '- "Making a $5,000 product ad in 67 seconds no yapping (watch me cook)"',
    '- "No way this is legal…"',
    '- "Wait… Getimg can do WHAT?!"',
    '- "Getimg just ENDED product photoshoots"',
    '- "I\'m never paying for a product shoot again"',
    "Every video shows Getimg being used on screen: the steps, then the result.",
  ].join("\n"),
  exampleUrls: [
    "https://www.instagram.com/loyxz_z/reel/De-eBwyJmpJ/",
    "https://www.instagram.com/joetestsai/reel/DaJPnE1x_Bh/",
    "https://www.instagram.com/baileybuildsai/reel/Ddb9HyNR_Qa/",
    "https://www.instagram.com/itsreallyroseeee/reel/De-nTR7Ko1A/",
    "https://www.tiktok.com/@createwfemi/video/7689635610138529045",
  ],
  guide: [
    "## What Getimg is",
    "**Getimg is one AI studio for images, video, music and speech.** You describe what you want, and it picks the best AI model for the job and improves your prompt.",
    "",
    "## What you can make with it",
    "- **Images** from a prompt",
    "- **Video** from text or a single image",
    "- **UGC ad videos** with a presenter, for a product",
    "- **360° product spins** from a few photos",
    "- **Music**, **voiceovers** and **sound effects**",
    "- **Headshots** from one selfie",
    "- **Edits**: remove backgrounds and objects, relight a photo, and upscale images and video",
    "",
    "## One place for 50+ models",
    "Kling, Nano Banana, FLUX, GPT Image, Seedream, Veo and more, without paying for each one separately.",
    "",
    "## Elements",
    "Save a character, style or product and reuse it, so it looks the same in every video.",
    "",
    "## Creative freedom",
    "**You have full creative freedom.** The scripts are a starting point, not a rule. Bring your own innovative video ideas, new formats and your own style. If it shows what Getimg can make and it works, it's welcome, and unique videos that go viral are rewarded.",
    "",
    "## How you get paid",
    "- **$10** for every unique video. The same video posted on another platform earns view pay only.",
    "- **$3 per 1,000 views**, from 1K to 100K views",
    "- **Rewards**: $250 at 250K views, $350 at 500K and $750 at 1M. The highest one a video reaches counts.",
    "- **Up to $750 per video**",
    "- **7 videos a week** on TikTok, Instagram Reels or YouTube Shorts",
    "- Only views in the first 30 days after a post goes live count. Keep each post public for 90 days.",
  ].join("\n"),
  scripts: [
    "Use these hooks or similar ones, and make each format your own. Show what Getimg makes on screen: the result is the proof. You have full creative freedom, so your own innovative ideas and new formats are just as welcome as these scripts.",
    "",
    "## Which account to use",
    "**Post on your own account, or a new one made for this campaign. Both are fine.**",
    "Getimg wants lots of strong videos, so an account that posts often works well.",
    "",
    "**Every video must show the Getimg demo on screen**, not just the finished result: open Getimg, add the product, pick the tool, and show what comes out.",
    "",
    "### 1. No yapping, split screen",
    '- Hook (text on screen): "Making a $5,000 product ad in 67 seconds no yapping (watch me cook)"',
    "- Top half: you to camera with tape over your mouth, reacting. No talking, just trending audio.",
    '- Bottom half: the screen recording, with a step on screen for each part ("Step 1: Go to getimg.ai", "Step 2: Upload your product", "Step 3: Wait").',
    "- End on the finished ad, then your reaction.",
    "",
    "### 2. Reaction hook, then demo",
    '- Hook: a big reaction to camera with text like "No way this is legal…" or "Wait… Getimg can do WHAT?!"',
    "- Cut to filming your laptop screen and point at each step with a pen or your finger.",
    '- Short captions for each step ("go to getimg.ai", "upload your product", "pick the video model").',
    "- End on the result.",
    "",
    "### 3. \"Getimg just ENDED…\" hook",
    '- Hook: "Getimg just ENDED product photoshoots" over your laptop, with the Getimg result already on screen.',
    "- Cut to you reacting to camera, then back to the screen to show how you made it.",
    "",
    "### 4. One photo, full commercial",
    '- Hook: "I turned ONE product photo into a full commercial."',
    "- Screen-record every step: the photo goes in, you pick the format, the ad comes out.",
    "- Talk to camera or use a voiceover while the demo plays.",
    "",
    "### 5. Step-by-step tutorial",
    '- Hook: "Here\'s how I make product ads without a camera."',
    "- Film your screen and walk through Getimg one step at a time, with text for each step.",
    "- Finish on the before and after side by side.",
    "",
    "**Don't promise income, views or results in your videos.** A price tag on the ad you made is fine; saying viewers will earn money is not.",
  ].join("\n"),
  postTerms: {
    v: 2,
    // $10 for each unique video; the same video on another platform earns view pay only.
    basePerPost: 10,
    cycleSize: 15,
    repostsEarnBase: false,
    // $3 per 1,000 views from 1K to 100K, plus the highest reward a video reaches; at most $750 a video in all.
    cpm: [{ from: 1_000, rate: 3 }],
    cpmCap: 100_000,
    milestones: [
      { views: 250_000, amount: 250 },
      { views: 500_000, amount: 350 },
      { views: 1_000_000, amount: 750 },
    ],
    maxPerPost: 740,
    windowDays: 30,
    keepPublicDays: 90,
    platforms: ["tiktok", "instagram", "youtube_shorts"],
  },
};

export const CAMPAIGN_PRESETS: CampaignPreset[] = [MEPERSONA, GETIMG];

/** What a campaign's terms record once a setup is applied, so it is applied once per version. */
export function presetMarker(preset: CampaignPreset): string {
  return `${preset.key}@${preset.version}`;
}

/**
 * The campaign row as the setup makes it: the brief, the brand note, the example videos and the pay terms, with
 * "Formats that work" cleared. Who reviews posts and the brand's signed contract are kept from `kept`; a setup with
 * no pay terms, example videos or sample setting leaves the campaign's own.
 */
export function presetRow(preset: CampaignPreset, kept: Partial<PostTerms> | null) {
  const terms = preset.postTerms
    ? {
        ...preset.postTerms,
        reviewer: kept?.reviewer ?? "oncamera",
        ...(kept?.contract ? { contract: kept.contract } : {}),
      }
    : kept;
  return {
    about: preset.about,
    description: preset.description,
    formats: null,
    ...(preset.exampleUrls ? { example_urls: preset.exampleUrls } : {}),
    ...(preset.sampleRequired !== undefined
      ? { sample_required: preset.sampleRequired, sample_criteria: preset.sampleCriteria ?? null }
      : {}),
    ...(preset.postTerms ? { payout_amount: preset.postTerms.basePerPost } : {}),
    post_terms: { ...terms, preset: presetMarker(preset) },
  };
}

export function presetFor(job: {
  title: string;
  about: string | null;
}): CampaignPreset | null {
  return CAMPAIGN_PRESETS.find((p) => p.matches(job)) ?? null;
}
