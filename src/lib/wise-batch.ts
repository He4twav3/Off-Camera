import { toCsv } from "@/lib/csv";
import type { BankDetails } from "@/lib/bank-details";

/**
 * The payment file a brand uploads in Wise (Payments → Batch). Wise's "Send to bank accounts"
 * template has its own columns for each currency, and only a signed-in Wise Business account
 * can download it, so the brand uploads its blank template (as CSV) once and we fill every
 * column we recognise, by name. Without a template we use the same column names Wise uses.
 * One source currency per file (USD); the amount is the statement total in USD.
 *
 * Pure (no server imports) so it can be tested.
 */

export type BatchRow = { details: BankDetails; amount: number; reference: string };

/** Column names lower-cased with only letters and digits kept, to the value for one row. */
const COLUMNS: Record<string, (r: BatchRow) => string> = {
  name: (r) => r.details.holderName,
  recipientname: (r) => r.details.holderName,
  accountholdername: (r) => r.details.holderName,
  recipientemail: (r) => r.details.email,
  email: (r) => r.details.email,
  paymentreference: (r) => r.reference,
  reference: (r) => r.reference,
  recipienttype: () => "PRIVATE",
  receivertype: () => "PRIVATE",
  amountcurrency: () => "source",
  amount: (r) => r.amount.toFixed(2),
  sourcecurrency: () => "USD",
  targetcurrency: (r) => r.details.currency,
  iban: (r) => r.details.bank.iban ?? "",
  bic: (r) => r.details.bank.bic ?? "",
  swift: (r) => r.details.bank.bic ?? "",
  swiftcode: (r) => r.details.bank.bic ?? "",
  sortcode: (r) => r.details.bank.sortCode ?? "",
  accountnumber: (r) => r.details.bank.accountNumber ?? "",
  abartn: (r) => r.details.bank.abartn ?? "",
  routingnumber: (r) => r.details.bank.abartn ?? "",
  achroutingnumber: (r) => r.details.bank.abartn ?? "",
  accounttype: (r) => r.details.bank.accountType ?? "",
  bsbcode: (r) => r.details.bank.bsbCode ?? "",
  bsb: (r) => r.details.bank.bsbCode ?? "",
  institutionnumber: (r) => r.details.bank.institutionNumber ?? "",
  transitnumber: (r) => r.details.bank.transitNumber ?? "",
  ifsccode: (r) => r.details.bank.ifscCode ?? "",
  ifsc: (r) => r.details.bank.ifscCode ?? "",
  clabe: (r) => r.details.bank.clabe ?? "",
  addresscountrycode: (r) => r.details.country,
  addresscountry: (r) => r.details.country,
  country: (r) => r.details.country,
  addresscity: (r) => r.details.city,
  city: (r) => r.details.city,
  addressfirstline: (r) => r.details.address,
  addressline1: (r) => r.details.address,
  addresspostcode: (r) => r.details.postCode,
  addresspostalcode: (r) => r.details.postCode,
  postcode: (r) => r.details.postCode,
  addressstate: (r) => r.details.state,
  state: (r) => r.details.state,
};

/** Used when the brand hasn't uploaded its Wise template. */
export const DEFAULT_HEADER = [
  "name",
  "recipientEmail",
  "paymentReference",
  "receiverType",
  "amountCurrency",
  "amount",
  "sourceCurrency",
  "targetCurrency",
  "IBAN",
  "BIC",
  "sortCode",
  "accountNumber",
  "abartn",
  "accountType",
  "bsbCode",
  "institutionNumber",
  "transitNumber",
  "ifscCode",
  "clabe",
  "addressCountryCode",
  "addressCity",
  "addressFirstLine",
  "addressPostCode",
  "addressState",
];

const key = (h: string) => h.replace(/^﻿/, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Parses CSV text (quoted cells, "" escapes, CRLF or LF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export type TemplateResult = { ok: true; header: string[]; unknown: string[] } | { ok: false; error: string };

/** The header row of a Wise template, and which of its columns we can't fill. */
export function readTemplate(text: string): TemplateResult {
  const rows = parseCsv(text);
  const header = (rows[0] ?? []).map((h) => h.replace(/^﻿/, "").trim());
  if (header.length < 3) return { ok: false, error: "That doesn't look like a Wise batch template. Download it from Wise as CSV and upload it unchanged." };
  const known = header.filter((h) => COLUMNS[key(h)]);
  if (!known.some((h) => key(h) === "amount") || !known.some((h) => key(h) === "targetcurrency"))
    return { ok: false, error: "That file is missing Wise's amount and targetCurrency columns. Download the \"Send to bank accounts\" template from Wise as CSV and upload it unchanged." };
  return { ok: true, header, unknown: header.filter((h) => !COLUMNS[key(h)]) };
}

/** The finished file: the template's header, then one row per creator. Column names are never changed. */
export function buildBatchCsv(rows: BatchRow[], header: string[] = DEFAULT_HEADER): string {
  return toCsv([header, ...rows.map((r) => header.map((h) => COLUMNS[key(h)]?.(r) ?? ""))]);
}

/** One payment per creator per file: a creator owed on several statements is paid the total, once. */
export function mergeByCreator<T extends { applicantId: string; amount: number; reference: string; details: BankDetails }>(items: T[]): BatchRow[] {
  const byCreator = new Map<string, BatchRow>();
  for (const it of items) {
    const prev = byCreator.get(it.applicantId);
    if (prev) prev.amount = Math.round((prev.amount + it.amount) * 100) / 100;
    else byCreator.set(it.applicantId, { details: it.details, amount: it.amount, reference: it.reference });
  }
  return [...byCreator.values()];
}
