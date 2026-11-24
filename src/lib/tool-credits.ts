import { GETIMG } from "@/lib/campaign-presets";

/**
 * Free tool credits for creators on a brand's campaign, topped up by the brand by hand: a creator on the campaign
 * makes a free account on the brand's site and gives us that account's email; we send the brand the list of new
 * emails, the brand adds credits to each account, and we mark them sent. Pure, so the tests check it; the list
 * itself is private and lives in Storage (lib/tool-credits-store.ts).
 */
export type CreditProgram = {
  key: string;
  brand: string;
  /** Which campaigns carry it: the same match as the brand's campaign setup. */
  matches: (job: { title: string; about: string | null }) => boolean;
  signupUrl: string;
  /** Shown as a link in the steps. */
  signupLabel: string;
};

export const GETIMG_CREDITS: CreditProgram = {
  key: "getimg",
  brand: "getimg.ai",
  matches: GETIMG.matches,
  signupUrl: "https://getimg.ai/register",
  signupLabel: "getimg.ai",
};

export const CREDIT_PROGRAMS: CreditProgram[] = [GETIMG_CREDITS];

export function creditProgramFor(job: { title: string; about: string | null }): CreditProgram | null {
  return CREDIT_PROGRAMS.find((p) => p.matches(job)) ?? null;
}

export function creditProgramByKey(key: string): CreditProgram | null {
  return CREDIT_PROGRAMS.find((p) => p.key === key) ?? null;
}

/** One creator's request: the email of their account on the brand's site, and whether it went to the brand. */
export type CreditRequest = {
  applicantId: string;
  name: string;
  /** Their On Camera email, so the brand can match them up if they ask. */
  email: string;
  /** The email of their account on the brand's site. */
  toolEmail: string;
  submittedAt: string;
  /** When we marked it as sent to the brand. Unset while it's waiting. */
  sentAt?: string;
};

/** An email as typed, trimmed and lowercased, or null if it isn't one. */
export function normalizeEmail(input: string): string | null {
  const s = input.trim().toLowerCase();
  if (s.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(s) ? s : null;
}

/**
 * Adds or changes a creator's request. A new email goes back on the waiting list, since the brand has to top up the
 * new account; the same email again changes nothing.
 */
export function upsertRequest(list: CreditRequest[], req: Omit<CreditRequest, "sentAt">): CreditRequest[] {
  const had = list.find((r) => r.applicantId === req.applicantId);
  if (had && had.toolEmail === req.toolEmail) return list;
  const rest = list.filter((r) => r.applicantId !== req.applicantId);
  return [...rest, { ...req }];
}

/** Requests still to send to the brand, oldest first. */
export function waiting(list: CreditRequest[]): CreditRequest[] {
  return list.filter((r) => !r.sentAt).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

/** Marks these creators' requests as sent. Only those still waiting, so a date already set is kept. */
export function markSent(list: CreditRequest[], applicantIds: string[], at: string): { list: CreditRequest[]; marked: number } {
  const ids = new Set(applicantIds);
  let marked = 0;
  const out = list.map((r) => {
    if (!ids.has(r.applicantId) || r.sentAt) return r;
    marked++;
    return { ...r, sentAt: at };
  });
  return { list: out, marked };
}

/** Puts one request back on the waiting list (marked sent by mistake). */
export function unmarkSent(list: CreditRequest[], applicantId: string): CreditRequest[] {
  return list.map((r) => (r.applicantId === applicantId ? { applicantId: r.applicantId, name: r.name, email: r.email, toolEmail: r.toolEmail, submittedAt: r.submittedAt } : r));
}

const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** The list to send the brand: the account email to top up first, then who it is. */
export function creditsCsv(program: CreditProgram, rows: CreditRequest[]): string {
  const head = [`${program.brand} account email`, "creator name", "added on"];
  const lines = rows.map((r) => [r.toolEmail, r.name, r.submittedAt.slice(0, 10)].map(cell).join(","));
  return "﻿" + [head.map(cell).join(","), ...lines].join("\r\n") + "\r\n";
}
