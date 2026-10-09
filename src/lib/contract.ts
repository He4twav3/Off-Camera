/**
 * The campaign contract, written from what the platform already knows (the pay terms) plus the details the brand
 * fills in on its own campaign page. Pure (no server imports) so the brand page, the admin page, the Word download
 * and the tests all produce the same text. A DRAFT: a lawyer must review the wording before it is relied on.
 */
import { STATEMENT_DUE_DAYS } from "@/lib/direct-pay";
import type { ContractDetails, PostTerms } from "@/lib/post-terms";

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: Math.round(n * 100) % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
const views = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1_000 ? `${n / 1_000}K` : String(n));
const PLATFORM: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube_shorts: "YouTube Shorts", x: "X" };

/** The pay fields that matter, as one string. If it differs from what was agreed, the brand must agree again. */
export function termsFingerprint(t: PostTerms): string {
  return JSON.stringify({
    b: t.basePerPost,
    c: t.cycleSize,
    m: [...t.milestones].sort((a, b) => a.views - b.views).map((m) => [m.views, m.amount]),
    w: t.windowDays,
    k: t.keepPublicDays,
    p: [...t.platforms].sort(),
    r: t.repostsEarnBase,
  });
}

export type ContractStatus = "none" | "signed" | "changed";

/** none: the brand hasn't agreed; changed: it agreed, then the pay terms changed; signed: up to date. */
export function contractStatus(t: PostTerms): ContractStatus {
  if (!t.contract) return "none";
  return t.contract.terms === termsFingerprint(t) ? "signed" : "changed";
}

export type ContractSection = { heading: string; lines: string[] };

export function contractSections(input: {
  campaign: string;
  agency: string;
  terms: PostTerms;
  /** What the brand has typed so far; anything missing shows as a blank to fill. */
  brand?: Partial<Pick<ContractDetails, "legalName" | "address" | "country" | "signatory" | "signatoryRole">>;
}): ContractSection[] {
  const { terms: t, brand } = input;
  const blank = (v: string | undefined, label: string) => (v && v.trim() ? v.trim() : `[${label}]`);
  const platforms = t.platforms.map((p) => PLATFORM[p] ?? p).join(", ");
  const sections: ContractSection[] = [
    {
      heading: "1. Parties",
      lines: [
        `Brand: ${blank(brand?.legalName, "brand legal name")}, ${blank(brand?.address, "address")}, ${blank(brand?.country, "country")}.`,
        `Creator: each creator who joins the campaign "${input.campaign}" through ${input.agency}, identified by the account they verify on the platform.`,
        `${input.agency} runs the platform that connects them, checks videos and tracks views. ${input.agency} does not hold or send any money.`,
      ],
    },
    {
      heading: "2. The work",
      lines: [
        `The creator makes short videos for the campaign "${input.campaign}", following the brief shown on the campaign page, and posts them on: ${platforms}.`,
        "A post must be on an account the creator has verified on the platform, and go live after they joined the campaign.",
        "A unique video is one new piece of content. The first platform a creator posts on is their main platform. The same video posted on other platforms is a repost.",
      ],
    },
    {
      heading: "3. Pay",
      lines: [
        t.basePerPost > 0
          ? t.repostsEarnBase
            ? `Base pay: ${usd(t.basePerPost)} for each approved post.`
            : `Base pay: ${usd(t.basePerPost)} for each unique video on the creator's main platform. A repost earns view bonuses only, not base pay.`
          : "There is no base pay per video.",
        ...(t.milestones.length > 0
          ? [
              `Bonus for each post, at the highest milestone it reaches: ${t.milestones.map((m) => `${views(m.views)} views, ${usd(m.amount)}`).join("; ")}.`,
              "Bonuses do not stack: a post that reaches a higher milestone earns that milestone's amount in total, so the creator is paid the difference.",
            ]
          : []),
        `Only views within ${t.windowDays} days of a post going live count. After that the number is final.`,
        `A payment falls due each time the creator has delivered ${t.cycleSize} ${t.repostsEarnBase ? "approved posts" : "unique videos"}.`,
        t.reviewer === "brand"
          ? "The brand approves each video before it counts towards what is owed."
          : `${input.agency} approves each video before it counts towards what is owed. The brand can still deny a video.`,
      ],
    },
    {
      heading: "4. Payment",
      lines: [
        `The brand pays the creator directly, through the creator's own Stripe or Wise payment link, from the brand's own account. ${input.agency} never holds the money.`,
        "All amounts are in US dollars. The brand pays the full amount shown on the statement and covers any transfer or conversion fees, so the creator receives all of it.",
        `The brand pays within ${STATEMENT_DUE_DAYS} days of a statement being issued, then marks it as paid so the creator can confirm.`,
      ],
    },
    {
      heading: "5. Content",
      lines: [
        t.keepPublicDays > 0 ? `The creator keeps each approved post public for ${t.keepPublicDays} days.` : "There is no minimum time a post must stay public.",
        "Posts are labelled as a paid partnership where the law or the platform requires it.",
        "The creator uses only music, images and fonts they have the right to use.",
        "[Usage rights, exclusivity and ownership of the videos: to be written by the reviewing lawyer.]",
      ],
    },
    {
      heading: "6. General",
      lines: [
        `This contract is governed by the law of ${blank(brand?.country, "country")}. [Governing law, liability and disputes: to be confirmed by the reviewing lawyer.]`,
        "These terms apply to a creator when they join the campaign. If the pay terms are changed, the brand agrees to the new terms again before they apply to new videos.",
      ],
    },
    {
      heading: "Signed for the brand",
      lines: [`${blank(brand?.signatory, "name")}${brand?.signatoryRole ? `, ${brand.signatoryRole}` : ""}`],
    },
  ];
  return sections;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The contract as a Word-openable document (HTML with Word's own wrapper). */
export function contractWordHtml(input: { title: string; sections: ContractSection[]; signedLine: string | null }): string {
  const body = input.sections
    .map((s) => `<h2>${esc(s.heading)}</h2>${s.lines.map((l) => `<p>${esc(l)}</p>`).join("")}`)
    .join("");
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(input.title)}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4}h1{font-size:18pt}h2{font-size:13pt;margin-top:16pt}.draft{color:#a00;font-weight:bold}</style></head><body><p class="draft">Draft: have a lawyer review this before relying on it.</p><h1>${esc(input.title)}</h1>${body}${input.signedLine ? `<p><i>${esc(input.signedLine)}</i></p>` : ""}</body></html>`;
}
