/**
 * The bank details a creator gives so a brand can pay them through a Wise Business batch
 * ("Send to bank accounts" template). Each currency needs its own local details, the same
 * ones Wise asks for: an IBAN in Europe, sort code and account number in the UK, routing
 * and account number in the US, and so on. Never a card number: Wise pays into bank
 * accounts, and anything that looks like a card is refused.
 *
 * Pure (no server imports), so it's safe in client components and easy to test.
 */

export type BankField =
  | "iban"
  | "bic"
  | "sortCode"
  | "accountNumber"
  | "abartn"
  | "accountType"
  | "bsbCode"
  | "institutionNumber"
  | "transitNumber"
  | "ifscCode"
  | "clabe";

export const FIELD_LABEL: Record<BankField, { label: string; hint?: string; placeholder?: string }> = {
  iban: { label: "IBAN", hint: "On your banking app or statement. Starts with two letters. Not your card number.", placeholder: "DE89 3704 0044 0532 0130 00" },
  bic: { label: "BIC / SWIFT (optional)", placeholder: "COBADEFFXXX" },
  sortCode: { label: "Sort code", placeholder: "40-30-20" },
  accountNumber: { label: "Account number", hint: "Your bank account number, not your card number." },
  abartn: { label: "Routing number (ABA)", hint: "9 digits, on your checks or banking app.", placeholder: "026009593" },
  accountType: { label: "Account type" },
  bsbCode: { label: "BSB", placeholder: "062-000" },
  institutionNumber: { label: "Institution number", placeholder: "001" },
  transitNumber: { label: "Transit number", placeholder: "00012" },
  ifscCode: { label: "IFSC code", placeholder: "HDFC0000123" },
  clabe: { label: "CLABE", hint: "18 digits.", placeholder: "032180000118359719" },
};

type CurrencySpec = {
  label: string;
  fields: BankField[];
  /** IBAN currencies: the countries whose IBANs belong to it. Empty means any. */
  ibanCountries?: string[];
};

export const CURRENCIES: Record<string, CurrencySpec> = {
  EUR: { label: "Euro (EUR)", fields: ["iban", "bic"] },
  USD: { label: "US dollar (USD), US bank account", fields: ["abartn", "accountNumber", "accountType"] },
  GBP: { label: "British pound (GBP)", fields: ["sortCode", "accountNumber"] },
  CAD: { label: "Canadian dollar (CAD)", fields: ["institutionNumber", "transitNumber", "accountNumber", "accountType"] },
  AUD: { label: "Australian dollar (AUD)", fields: ["bsbCode", "accountNumber"] },
  NZD: { label: "New Zealand dollar (NZD)", fields: ["accountNumber"] },
  CHF: { label: "Swiss franc (CHF)", fields: ["iban"], ibanCountries: ["CH", "LI"] },
  PLN: { label: "Polish złoty (PLN)", fields: ["iban"], ibanCountries: ["PL"] },
  SEK: { label: "Swedish krona (SEK)", fields: ["iban"], ibanCountries: ["SE"] },
  DKK: { label: "Danish krone (DKK)", fields: ["iban"], ibanCountries: ["DK", "FO", "GL"] },
  NOK: { label: "Norwegian krone (NOK)", fields: ["iban"], ibanCountries: ["NO"] },
  CZK: { label: "Czech koruna (CZK)", fields: ["iban"], ibanCountries: ["CZ"] },
  HUF: { label: "Hungarian forint (HUF)", fields: ["iban"], ibanCountries: ["HU"] },
  RON: { label: "Romanian leu (RON)", fields: ["iban"], ibanCountries: ["RO"] },
  INR: { label: "Indian rupee (INR)", fields: ["ifscCode", "accountNumber"] },
  MXN: { label: "Mexican peso (MXN)", fields: ["clabe"] },
};

export type BankDetails = {
  holderName: string;
  email: string;
  currency: string;
  country: string; // ISO 3166 alpha-2, where the account holder lives
  city: string;
  address: string; // first line
  postCode: string;
  state: string;
  bank: Partial<Record<BankField, string>>;
};

/** Countries that need a state or province in the address. */
export const STATE_COUNTRIES = ["US", "CA", "AU"];

// Every ISO 3166-1 alpha-2 code. Names come from Intl.DisplayNames where shown.
export const COUNTRY_CODES =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(
    " ",
  );

const digits = (s: string) => s.replace(/[\s-]/g, "");

/** IBAN check digits (ISO 13616, mod 97). */
export function ibanValid(raw: string): boolean {
  const iban = raw.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const moved = iban.slice(4) + iban.slice(0, 4);
  let rem = 0;
  for (const ch of moved) {
    const v = ch >= "A" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of v) rem = (rem * 10 + Number(d)) % 97;
  }
  return rem === 1;
}

/** US routing number checksum (3-7-1 weights). */
export function abaValid(raw: string): boolean {
  const d = digits(raw);
  if (!/^\d{9}$/.test(d)) return false;
  const n = d.split("").map(Number);
  const sum = 3 * (n[0] + n[3] + n[6]) + 7 * (n[1] + n[4] + n[7]) + (n[2] + n[5] + n[8]);
  return sum % 10 === 0;
}

function luhnValid(d: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let x = d.charCodeAt(i) - 48;
    if (double) {
      x *= 2;
      if (x > 9) x -= 9;
    }
    sum += x;
    double = !double;
  }
  return sum % 10 === 0;
}

/** A card number: 13-19 digits, a card network's opening digits, and a valid Luhn check. */
export function isCardNumber(raw: string): boolean {
  const d = digits(raw);
  if (!/^\d{13,19}$/.test(d)) return false;
  if (!/^(4|5[1-5]|2[2-7]|3[47]|6(011|5))/.test(d)) return false;
  return luhnValid(d);
}

/** True when free text (a name, an address) has a card number in it. */
export function containsCardNumber(text: string): boolean {
  return (text.match(/\d(?:[ -]?\d){12,18}/g) ?? []).some(isCardNumber);
}

const CARD_ERROR =
  "That looks like a card number. Never enter a card number here. We need your bank account details (like your IBAN), which are on your banking app or statement.";

type Check = (v: string) => string | null;

const FIELD_CHECK: Record<BankField, Check> = {
  iban: (v) => (ibanValid(v) ? null : "That IBAN isn't right. Check it on your banking app: it starts with two letters, like DE89…"),
  bic: (v) => (!v || /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v) ? null : "A BIC is 8 or 11 letters and numbers, like COBADEFFXXX."),
  sortCode: (v) => (/^\d{6}$/.test(v) ? null : "A sort code is 6 digits, like 40-30-20."),
  accountNumber: (v) => (/^\d{4,20}$/.test(v) ? null : "An account number is digits only."),
  abartn: (v) => (abaValid(v) ? null : "That routing number isn't right. It's 9 digits."),
  accountType: (v) => (v === "CHECKING" || v === "SAVINGS" ? null : "Choose checking or savings."),
  bsbCode: (v) => (/^\d{6}$/.test(v) ? null : "A BSB is 6 digits, like 062-000."),
  institutionNumber: (v) => (/^\d{3}$/.test(v) ? null : "An institution number is 3 digits."),
  transitNumber: (v) => (/^\d{5}$/.test(v) ? null : "A transit number is 5 digits."),
  ifscCode: (v) => (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v) ? null : "An IFSC code is 11 characters, like HDFC0000123."),
  clabe: (v) => (/^\d{18}$/.test(v) ? null : "A CLABE is 18 digits."),
};

/** Per-currency lengths for the account number, where a country has a fixed format. */
const ACCOUNT_LENGTH: Record<string, [number, number]> = {
  GBP: [8, 8],
  USD: [4, 17],
  CAD: [7, 12],
  AUD: [5, 10],
  NZD: [15, 16],
  INR: [9, 18],
};

function clean(field: BankField, raw: string): string {
  const v = raw.trim();
  if (field === "iban" || field === "bic" || field === "ifscCode") return v.replace(/\s/g, "").toUpperCase();
  if (field === "accountType") return v.toUpperCase();
  return digits(v);
}

export type BankResult = { ok: true; value: BankDetails } | { ok: false; error: string };

/** Checks what a creator typed. Text values come in as a plain record (from FormData). */
export function parseBankDetails(input: Record<string, string | undefined>): BankResult {
  const get = (k: string) => (input[k] ?? "").trim().replace(/\s+/g, " ");
  const currency = get("currency").toUpperCase();
  const spec = CURRENCIES[currency];
  if (!spec) return { ok: false, error: "Choose the currency your bank account is in." };

  const holderName = get("holderName");
  if (holderName.length < 3 || !/\s/.test(holderName))
    return { ok: false, error: "Add your full name exactly as it is on your bank account (first and last name)." };
  if (holderName.length > 100) return { ok: false, error: "Keep the name under 100 characters." };

  const country = get("country").toUpperCase();
  if (!COUNTRY_CODES.includes(country)) return { ok: false, error: "Choose the country you live in." };
  if (currency === "USD" && country !== "US")
    return { ok: false, error: "US dollars go to US bank accounts only. Choose the currency of your own bank account." };
  const city = get("city");
  const address = get("address");
  const postCode = get("postCode");
  const state = get("state");
  if (address.length < 3) return { ok: false, error: "Add your street address. Wise needs it for the transfer." };
  if (city.length < 2) return { ok: false, error: "Add your city." };
  if (STATE_COUNTRIES.includes(country) && state.length < 2) return { ok: false, error: "Add your state or province." };
  if ([address, city, postCode, state].some((s) => s.length > 100)) return { ok: false, error: "Keep each address line under 100 characters." };

  for (const text of [holderName, address, city, postCode, state]) if (containsCardNumber(text)) return { ok: false, error: CARD_ERROR };

  const bank: Partial<Record<BankField, string>> = {};
  for (const field of spec.fields) {
    const v = clean(field, get(field));
    if (field === "bic" && !v) continue;
    if (!v) return { ok: false, error: `Add your ${FIELD_LABEL[field].label.replace(" (optional)", "")}.` };
    if (isCardNumber(v) && currency !== "NZD") return { ok: false, error: CARD_ERROR };
    const problem = FIELD_CHECK[field](v);
    if (problem) return { ok: false, error: problem };
    if (field === "accountNumber" && ACCOUNT_LENGTH[currency]) {
      const [min, max] = ACCOUNT_LENGTH[currency];
      if (v.length < min || v.length > max)
        return { ok: false, error: min === max ? `The account number is ${min} digits.` : `The account number is ${min} to ${max} digits.` };
    }
    if (field === "iban" && spec.ibanCountries?.length && !spec.ibanCountries.includes(v.slice(0, 2)))
      return { ok: false, error: `That IBAN isn't for a ${currency} account. Choose the currency your account is in.` };
    bank[field] = v;
  }

  return {
    ok: true,
    value: { holderName, email: get("email"), currency, country, city, address, postCode, state, bank },
  };
}

/** What's safe to show anywhere: the currency and the last 4 characters, never the full details. */
export function bankSummary(d: BankDetails): string {
  const main = d.bank.iban ? "IBAN" : d.bank.clabe ? "CLABE" : "account";
  const value = d.bank.iban ?? d.bank.clabe ?? d.bank.accountNumber ?? "";
  return `Bank account in ${d.currency} · ${main} ending ${value.slice(-4)}`;
}
