import { MEPERSONA } from "@/lib/campaign-presets";
import { parseCsv } from "@/lib/wise-batch";

/**
 * Brand affiliate programs: a brand gives each creator on its campaign a private, one-time partner code, the creator
 * signs up with it on the brand's own site and gets a personal link to share, and the brand reports sign-ups per
 * code number. The wording is the brand's own (its partner guides), signed off by the owner. Pure, so the tests
 * check it; the codes themselves are private and live in Storage (lib/affiliate-codes.ts), never in this code.
 */
export type AffiliateProgram = {
  key: string;
  brand: string;
  /** Which campaigns carry it: the same match as the brand's campaign setup. */
  matches: (job: { title: string; about: string | null }) => boolean;
  /** What the creator gets, shown to everyone on the campaign page. */
  perks: string[];
  signupUrl: string;
  steps: string[];
  /** For a creator who already has an account with the brand. */
  existingAccount: string;
  /** Setting up the account once the link is made. */
  setup: string[];
  /** The line to say at the end of each video. */
  say: string;
  share: string;
  talkingPoints: string[];
  /** How the free month ends, and how to keep it. */
  freeMonth: string[];
  goodToKnow: string[];
  /** Where creators ask the brand questions. */
  supportEmail: string;
  /** Who at the brand switches a code off and sends a replacement. */
  contact: { name: string; email: string };
  /** The brand's creator guide, as it sent it (public/affiliates). */
  guidePdf: string;
  linkExample: string;
  /** A personal link from this program, after normalizeLink. */
  linkPattern: RegExp;
  /** Last day the codes work, as written to creators. */
  expires: string;
};

export const MEPERSONA_PARTNERS: AffiliateProgram = {
  key: "mepersona",
  brand: "MePersona",
  matches: MEPERSONA.matches,
  perks: [
    "Get a free month of MePersona Pro Elite, the top plan, with no card needed. You also get your own link to share, like mepersona.ai/go/yourname.",
    "Anyone who signs up through your link gets 20% off their first 3 months on any plan, plus a 7-day free trial.",
  ],
  signupUrl: "https://mepersona.ai/partners/oncamera",
  steps: [
    "Go to mepersona.ai/partners/oncamera",
    "Enter your partner code.",
    "Fill in your name, email, the link name you want and your main social handle. Choose carefully, because your link name can't be changed later.",
    "Click Create my partner link. Your link appears right away and is emailed to you.",
  ],
  existingAccount:
    "Already have a MePersona account? You'll get a confirmation email instead. Open it within 24 hours, sign in, and your link will be ready.",
  setup: [
    "Open the sign-in email MePersona sent you and click the link.",
    "Choose a password.",
    "Set up your persona. This is how MePersona learns to write in your voice, and it takes a few minutes.",
    "Connect your social accounts so your fan messages arrive in one inbox.",
  ],
  say: "Use my link in bio to get 20% off your first 3 months, plus a 7-day free trial.",
  share:
    "Mention MePersona in your content and share your link in your bio, caption or video description. Tell your audience what they get: 20% off their first 3 months on any plan. Mark it as a paid partnership (#ad or the platform's paid-partnership label).",
  talkingPoints: [
    "One inbox for fan messages from your connected platforms.",
    "Replies drafted in your own voice, so you can answer more fans without losing your personal touch.",
    "Available in English, Spanish and Traditional Chinese.",
  ],
  freeMonth: [
    "You get 30 days of Pro Elite, starting the day you sign up.",
    "It ends on its own, and you won't be charged.",
    "Want to keep it? Go to Billing in your MePersona account and click Keep my plan before your trial ends.",
  ],
  goodToKnow: [
    "Your link name can't be changed once you choose it.",
    "You can't use your own link to get the discount on your own account.",
    "The 20% off and the free trial are for new MePersona customers, and they're applied automatically at checkout. Your audience doesn't need a code.",
  ],
  supportEmail: "support@mepersona.ai",
  contact: { name: "Steven Hacker", email: "info@mepersona.ai" },
  guidePdf: "/affiliates/mepersona-creator-guide.pdf",
  linkExample: "mepersona.ai/go/yourname",
  linkPattern: /^https:\/\/mepersona\.ai\/go\/[a-z0-9._-]+$/i,
  expires: "December 31, 2026",
};

export const AFFILIATE_PROGRAMS: AffiliateProgram[] = [MEPERSONA_PARTNERS];

export function programFor(job: { title: string; about: string | null }): AffiliateProgram | null {
  return AFFILIATE_PROGRAMS.find((p) => p.matches(job)) ?? null;
}

export function programByKey(key: string): AffiliateProgram | null {
  return AFFILIATE_PROGRAMS.find((p) => p.key === key) ?? null;
}

/** One code, and who it went to. A retired code keeps its creator so the history stays readable. */
export type AffiliateCode = {
  number: number;
  code: string;
  status: "unused" | "given" | "retired";
  applicantId?: string;
  name?: string;
  email?: string;
  givenAt?: string;
  link?: string;
  retiredAt?: string;
};

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

/** The brand's code list (number, code, …) as it sent it. Only the number and the code are read. */
export function parseCodesCsv(text: string): { ok: true; codes: AffiliateCode[] } | { ok: false; error: string } {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  if (rows.length < 2) return { ok: false, error: "That file has no codes in it." };
  const header = rows[0].map(norm);
  const numberAt = header.indexOf("number");
  const codeAt = header.indexOf("code");
  if (numberAt < 0 || codeAt < 0) return { ok: false, error: "That file needs a \"number\" and a \"code\" column, like the list the brand sent." };
  const codes: AffiliateCode[] = [];
  const seen = new Set<string>();
  for (const row of rows.slice(1)) {
    const number = Number((row[numberAt] ?? "").trim());
    const code = (row[codeAt] ?? "").trim().toUpperCase();
    if (!code) continue;
    if (!Number.isInteger(number) || number < 1) return { ok: false, error: `The code ${code} has no number.` };
    if (!/^[A-Z0-9-]{4,40}$/.test(code)) return { ok: false, error: `"${code}" doesn't look like a code.` };
    if (seen.has(code)) continue;
    seen.add(code);
    codes.push({ number, code, status: "unused" });
  }
  if (codes.length === 0) return { ok: false, error: "That file has no codes in it." };
  return { ok: true, codes };
}

/** Adds codes not already in the list. Codes already there, and who has them, are never changed. */
export function mergeCodes(existing: AffiliateCode[], incoming: AffiliateCode[]): { codes: AffiliateCode[]; added: number } {
  const have = new Set(existing.map((c) => c.code));
  const fresh = incoming.filter((c) => !have.has(c.code));
  return { codes: [...existing, ...fresh].sort((a, b) => a.number - b.number), added: fresh.length };
}

/** The code a creator holds now, if any. */
export function heldBy(codes: AffiliateCode[], applicantId: string): AffiliateCode | null {
  return codes.find((c) => c.status === "given" && c.applicantId === applicantId) ?? null;
}

/** The next code to give out: the lowest unused number. */
export function nextFree(codes: AffiliateCode[]): AffiliateCode | null {
  return codes.filter((c) => c.status === "unused").sort((a, b) => a.number - b.number)[0] ?? null;
}

/** A personal link as typed ("mepersona.ai/go/sam", "https://www.mepersona.ai/go/sam/"), made whole, or null if it isn't one. */
export function normalizeLink(program: AffiliateProgram, input: string): string | null {
  let s = input.trim().replace(/\s+/g, "");
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  s = s.replace(/^http:\/\//i, "https://").replace(/^https:\/\/www\./i, "https://").replace(/\/+$/, "");
  return program.linkPattern.test(s) ? s : null;
}

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export type ReportRow = AffiliateCode & { posts: number; views: number };

/** The brand's own columns, then each creator's results on the campaign. */
export function reportCsv(rows: ReportRow[]): string {
  const head = ["number", "code", "status", "creator name", "email", "link", "given on", "videos", "views"];
  const lines = rows.map((r) =>
    [r.number, r.code, r.status, r.name ?? "", r.email ?? "", r.link ?? "", r.givenAt?.slice(0, 10) ?? "", r.posts, r.views].map(cell).join(","),
  );
  return "﻿" + [head.map(cell).join(","), ...lines].join("\r\n") + "\r\n";
}
