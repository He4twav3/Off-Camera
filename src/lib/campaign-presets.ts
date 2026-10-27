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
  exampleUrls: string[];
  guide: string;
  scripts: string;
  /** True: creators apply with a sample video, and an admin approves them onto the campaign. */
  sampleRequired: boolean;
  /** Everything but who reviews posts and the brand's signed contract, which are kept as they are. */
  postTerms: Omit<PostTerms, "reviewer" | "contract">;
};

export const MEPERSONA: CampaignPreset = {
  key: "mepersona",
  version: 6,
  label: "MePersona",
  matches: (job) =>
    `${job.title} ${job.about ?? ""}`.toLowerCase().includes("mepersona"),
  about:
    "Answer every comment, in your own voice. MePersona is an AI inbox for creators. It brings your post comments and DMs from Instagram, Facebook, YouTube and more into one place, drafts replies that sound like you, and schedules your posts across platforms. Answering every comment keeps the conversation going, and MePersona makes that possible without living in your apps all day.",
  description:
    "## Read the full brief\nIt explains what MePersona is and what it does, and it has this week's 5 scripts: the tool rating, why aren't more people batching, be on every platform without living on every platform, why your engagement is low, and this feels illegal to know.\n## Pick a script and make it your own\nWatch its example video below. Keep the example's hook and structure, then fill it with your own setup, your own platforms and your own real results, built around MePersona.\n## Use MePersona for a few days first\nSo what you show on screen is real: your inbox, your drafted replies, your scheduled posts.\n## Get paid monthly\nOne statement a month for everything you earned, paid within 7 days.",
  exampleUrls: [
    "https://www.tiktok.com/@dawn_flaherty/video/7595217979986529567",
    "https://www.tiktok.com/@sabrina_ramonov/video/7618606049490111758",
    "https://www.tiktok.com/@creators_growth_studio/video/7555584924158479630",
    "https://www.instagram.com/reel/DdcVV3zvI6i/",
  ],
  guide:
    "## What MePersona is\n**MePersona is an AI assistant that runs your social media in your voice.** You connect your social media accounts to it, and it helps you reply to people, write your posts and keep everything organized in one place. It learns how you talk, so everything it writes sounds like you, not a bot.\n\n## It learns your voice\nYou read a short sample out loud, and MePersona learns how you talk and write. You can also start from a ready-made persona or build one from scratch.\n\n## You connect your social media\nYou link your accounts to MePersona. Your comments and messages come into MePersona, and your posts go out from it, so you don't jump between apps.\n\n## It replies to your comments and messages\nWhen someone comments or sends you a DM, MePersona drafts a reply in your voice. Your followers still get a personal answer, without you staying on top of every single comment.\n\n## You stay in control\nNothing goes out until you approve it. Every reply and post waits in your Review Queue, where you approve, edit or skip it. Once you trust it, you can turn on auto-reply for simple, routine messages.\n\n## It writes and schedules your posts\nGive it one idea, and it drafts the script or caption for each platform in your voice. Approve it, schedule it, and it posts for you.\n\n## Everything in one place\n- All your comments and DMs from every platform in one inbox (paid plans)\n- A content vault that stores and auto-tags your videos and images\n- An analytics dashboard and a Marketing Agent that plans campaigns in your voice (paid plans)\n- English, Spanish and Traditional Chinese\n\n## Platforms\n! TikTok, X, Pinterest, LinkedIn and Bluesky: MePersona connects to these and can post and schedule for you. It does not reply to comments or DMs on them. Never say it does.\n**Replying to comments and messages works on:** Instagram, Facebook, YouTube, Discord, Telegram, WordPress and Mastodon. You can mention these for everything: replies, DMs, posting and scheduling.\n\nComing soon, so don't mention yet: LinkedIn Pages, Reddit, Twitch and WhatsApp.\n\n## What it costs\n- **Free:** no card needed. About 300 replies a month and 2 platforms.\n- **Premium, $29/month:** unlimited platforms, the all-in-one inbox and analytics.\n- Bigger plans exist for larger accounts. Paid plans have a 7-day free trial.",
  scripts:
    'Make the viral formats your own, built around MePersona: keep the example\'s hook and structure, then fill it with your own setup, your own platforms and your own real results. Use MePersona for a few days before filming, so the proof shots are real.\n\n### 1. Tool rating: good, good, good... GREAT\n- "Lets rate some tools that help me create content more efficiently."\n- "CapCut: good."\n- "Canva: good."\n- "ChatGPT: good."\n- "MePersona: GREAT."\n- "Why? Because it helps me create content, manage my comments and DMs, and stay consistent without spending all day online."\n- "One place, less work, more time to create."\n\n### 2. Why aren\'t more people batching?\n- Label: "write once, post everywhere"\n- Hook: "Why aren\'t more creators doing this? You want to post consistently without it eating your whole week, right?"\n- "Here\'s the part people skip: write once, post everywhere, in your own voice."\n- Background: one idea turning into a video script, a caption and a version for another platform.\n- [PROOF] Your posting calendar, with the week filled in.\n- End: "Nothing goes out until I approve it. Free to start, link in bio."\n\n### 3. Be on every platform without living on every platform\n- Title box: "How I\'m on 8 platforms as a small creator" / red line: "(without being online all day)"\n- Hook: "If you\'re a new creator and you\'re only on one platform, you\'re making it harder for yourself."\n- "Every platform is a new place for people to find you. The problem is you can\'t be in eight apps all day."\n- "So I use MePersona. My videos go out to TikTok and Pinterest, and comments and messages on Instagram, YouTube, Facebook and Discord get replies drafted in my voice."\n- [PROOF] Your connected platforms screen.\n- "I check in once a day, approve, and I\'m done."\n- End: "You can start free with 2 platforms. All of them is under $30 a month."\n\n### 4. Why your engagement is low (small creators)\n- Title box: "Small creators: why your engagement is low" / red line: "(it\'s not the algorithm)"\n- Hook: "Small creators, if your engagement is low, it might be one thing. You\'re not replying."\n- "When you\'re small, every comment counts. Someone comments, gets no answer, and doesn\'t bother next time."\n- "Big accounts can afford to ignore comments. You can\'t. Those first few hundred people are the ones who show up for every video."\n- "I used to leave comments sitting for days, because I was filming, editing and working at the same time." (only if true)\n- "Now MePersona drafts the replies in my voice, and I approve them in a few minutes."\n- [PROOF] Your comment section with your replies.\n- End: "It\'s free to start, with about 300 replies a month. Link in bio."\n\n### 5. This feels illegal to know\n- Hook, to camera: "This AI tool feels illegal to know as a creator."\n- "It answers your comments and DMs in your own voice. Let me show you in under 40 seconds."\n- Screen: "Make a free account, no card. Pick a persona, build one, or read a short sample out loud so it learns how you talk."\n- "Connect your accounts. Now every comment gets a reply drafted in your voice. You tap approve."\n- [PROOF] End on your real reply count or a busy comment section.\n- End: "About 300 replies a month free."',
  sampleRequired: true,
  postTerms: {
    v: 2,
    // $5 for each unique video; the same video on another platform earns view pay only.
    basePerPost: 5,
    cycleSize: 1,
    repostsEarnBase: false,
    // $2 per 1,000 views, counted up to 100K views, plus the highest reward a video reaches.
    cpm: [{ from: 0, rate: 2 }],
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

export const CAMPAIGN_PRESETS: CampaignPreset[] = [MEPERSONA];

/** What a campaign's terms record once a setup is applied, so it is applied once per version. */
export function presetMarker(preset: CampaignPreset): string {
  return `${preset.key}@${preset.version}`;
}

/**
 * The campaign row as the setup makes it: the brief, the brand note, the example videos and the pay terms, with
 * "Formats that work" cleared. Who reviews posts and the brand's signed contract are kept from `kept`.
 */
export function presetRow(preset: CampaignPreset, kept: Pick<PostTerms, "reviewer" | "contract"> | null) {
  return {
    about: preset.about,
    description: preset.description,
    formats: null,
    example_urls: preset.exampleUrls,
    sample_required: preset.sampleRequired,
    payout_amount: preset.postTerms.basePerPost,
    post_terms: {
      ...preset.postTerms,
      reviewer: kept?.reviewer ?? "oncamera",
      ...(kept?.contract ? { contract: kept.contract } : {}),
      preset: presetMarker(preset),
    },
  };
}

export function presetFor(job: {
  title: string;
  about: string | null;
}): CampaignPreset | null {
  return CAMPAIGN_PRESETS.find((p) => p.matches(job)) ?? null;
}
