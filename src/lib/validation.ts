// Shared input sanity checks for free-text profile fields.
//
// Two different jobs here:
//   1. Block genuinely offensive content — this is a profile you send to
//      brands, so slurs and porn words can't ride along.
//   2. Block obvious junk — "idk", "asdfgh", "xxxxxx". Not to be pedantic, but
//      because a profile full of placeholder text is worthless to you when
//      you're deciding who to put on a campaign.
//
// Deliberately NOT trying to be a content-moderation system. It's a first line
// that catches lazy input; you still eyeball profiles before approving them.

// Substring-matched, so "shitty" and "asshole" are caught by their stems.
// Kept intentionally short — a long list produces false positives on ordinary
// words (the "Scunthorpe problem"), which is worse than letting one through.
const BLOCKED_SUBSTRINGS = [
  "fuck",
  "shit",
  "cunt",
  "bitch",
  "bastard",
  "wanker",
  "dickhead",
  "pussy",
  "cock",
  "penis",
  "vagina",
  "boob",
  "tits",
  "porn",
  "nigg",
  "faggot",
  "retard",
  "whore",
  "slut",
  "rape",
];

// Exact-match junk. Whole-value only, so a bio mentioning "test footage" or a
// surname like "None" in a sentence isn't punished.
const PLACEHOLDER_VALUES = new Set([
  "idk",
  "dk",
  "n/a",
  "na",
  "none",
  "nothing",
  "nil",
  "null",
  "undefined",
  "test",
  "testing",
  "asdf",
  "asdfgh",
  "qwerty",
  "abc",
  "abcd",
  "xyz",
  "123",
  "1234",
  ".",
  "-",
  "?",
  "??",
  "x",
  "xx",
  "blank",
  "empty",
  "tbd",
  "whatever",
  "dunno",
  "no idea",
]);

export interface CheckResult {
  ok: boolean;
  error?: string;
}

const OK: CheckResult = { ok: true };

// Ordinary words that contain a blocked stem. Without these, "Scunthorpe" and
// "cocktail" get rejected — the classic Scunthorpe problem. Stripped before
// matching rather than special-cased after, so the list stays easy to extend.
const FALSE_POSITIVES = [
  "scunthorpe",
  "penistone",
  "clitheroe",
  "lightwater",
  "cocktail",
  "cockpit",
  "cockroach",
  "cocker",
  "hancock",
  "woodcock",
  "shiitake",
  "assassin",
  "assess",
  "assign",
  "assist",
  "associate",
  "assume",
  "classic",
  "grassroots",
  "titan",
  "titanic",
  "analysis",
  "analyst",
  "analytics",
  "therapist",
  "dickens",
  "dickinson",
  "essex",
  "sussex",
  "middlesex",
];

/**
 * Matches a blocked stem only at a word start — so "fucking" and "shitty" are
 * caught, while "Scunthorpe" (where "cunt" sits mid-word) is not. Known
 * innocent words are removed first for the cases where the stem genuinely does
 * begin a word, like "cocktail".
 */
function hasBlockedWord(value: string): boolean {
  let text = value.toLowerCase();

  for (const safe of FALSE_POSITIVES) {
    text = text.split(safe).join(" ");
  }

  return BLOCKED_SUBSTRINGS.some((stem) =>
    new RegExp(`\\b${stem}`, "i").test(text),
  );
}

/** Four or more of the same letter in a row: "xxxx", "aaaaa". */
function hasCharRun(value: string): boolean {
  return /([a-zA-Z])\1{3,}/.test(value);
}

/** Runs of adjacent keyboard keys, the classic mash. */
function isKeyboardMash(value: string): boolean {
  const v = value.toLowerCase().replace(/[^a-z]/g, "");
  if (v.length < 4) return false;
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  return rows.some((row) => {
    for (let i = 0; i + 4 <= v.length; i++) {
      const chunk = v.slice(i, i + 4);
      if (row.includes(chunk) || row.split("").reverse().join("").includes(chunk)) {
        return true;
      }
    }
    return false;
  });
}

/** No vowels at all in something long enough to need them. */
function hasNoVowels(value: string): boolean {
  const letters = value.toLowerCase().replace(/[^a-z]/g, "");
  return letters.length >= 4 && !/[aeiouy]/.test(letters);
}

interface CheckOptions {
  /** What to call the field in error messages, e.g. "Your name". */
  label: string;
  /** Run the junk checks too, not just profanity. Default true. */
  strict?: boolean;
}

/**
 * Runs the appropriate checks for a free-text value.
 * Empty input passes — required-ness is enforced separately by the schema.
 */
export function checkText(
  value: string | null | undefined,
  { label, strict = true }: CheckOptions,
): CheckResult {
  if (!value) return OK;
  const trimmed = value.trim();
  if (!trimmed) return OK;

  if (hasBlockedWord(trimmed)) {
    return {
      ok: false,
      error: `${label} contains language we can't accept on a profile shown to brands.`,
    };
  }

  if (!strict) return OK;

  if (PLACEHOLDER_VALUES.has(trimmed.toLowerCase())) {
    return {
      ok: false,
      error: `"${trimmed}" isn't a real answer for ${label.toLowerCase()}. Leave it blank if you'd rather not say.`,
    };
  }

  if (hasCharRun(trimmed)) {
    return { ok: false, error: `${label} has too many repeated letters.` };
  }

  if (isKeyboardMash(trimmed) || hasNoVowels(trimmed)) {
    return { ok: false, error: `${label} doesn't look like a real answer.` };
  }

  return OK;
}

/** Names: letters, spaces, hyphens, apostrophes. No digits or symbols. */
export function checkName(value: string): CheckResult {
  const trimmed = value.trim();

  if (trimmed.length < 2) {
    return { ok: false, error: "Enter your full name." };
  }
  if (!/^[\p{L}][\p{L}\s'’.-]*$/u.test(trimmed)) {
    return {
      ok: false,
      error: "Names can only use letters, spaces, hyphens and apostrophes.",
    };
  }
  if (!/\p{L}{2,}/u.test(trimmed)) {
    return { ok: false, error: "Enter your full name." };
  }

  return checkText(trimmed, { label: "Your name" });
}

/**
 * City names can't be validated by shape alone — "Blahblah" is letter-shaped
 * and would pass any regex. So the country comes from a fixed list (below) and
 * only the city is free text, checked for profanity and junk. That way the
 * part you'd actually filter campaigns on is guaranteed real.
 *
 * A full world city list would be ~150k entries; the country list plus a junk
 * check is the sane trade.
 */
export function checkCity(value: string): CheckResult {
  const trimmed = value.trim();
  if (!trimmed) return OK;

  if (trimmed.length < 2) {
    return { ok: false, error: "That city name is too short." };
  }
  if (trimmed.length > 60) {
    return { ok: false, error: "That city name is too long." };
  }
  if (!/^[\p{L}][\p{L}\s'’.-]*$/u.test(trimmed)) {
    return {
      ok: false,
      error: "City names use letters, spaces, hyphens and apostrophes only.",
    };
  }
  return checkText(trimmed, { label: "Your city" });
}

export function checkCountry(value: string): CheckResult {
  if (!value) return { ok: false, error: "Pick your country." };
  if (!(COUNTRIES as readonly string[]).includes(value)) {
    return { ok: false, error: "Pick your country from the list." };
  }
  return OK;
}

/** Builds the stored `location` string from the two validated parts. */
export function composeLocation(city: string, country: string): string {
  const c = city.trim();
  return c ? `${titleCasePlace(c)}, ${country}` : country;
}

/** Title-cases a place name so "thessaloniki" is stored as "Thessaloniki". */
export function titleCasePlace(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/(^|[\s,\-'])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
}

// Rate bounds. The floor exists because a creator asking $2 a video is either
// testing the form or misunderstands what's on offer — the seeded campaigns
// start around $90. The ceiling just catches a stray extra zero.
export const MIN_RATE = 5;
export const MAX_RATE = 100_000;

export function checkRate(
  min: number | null,
  max: number | null,
): CheckResult {
  for (const [value, which] of [
    [min, "minimum"],
    [max, "maximum"],
  ] as const) {
    if (value === null) continue;
    if (value < MIN_RATE) {
      return {
        ok: false,
        error: `A ${which} of $${value} is below what any campaign pays. Set it to $${MIN_RATE} or more, or leave it blank.`,
      };
    }
    if (value > MAX_RATE) {
      return {
        ok: false,
        error: `That ${which} looks like a typo — keep it under $${MAX_RATE.toLocaleString()}.`,
      };
    }
  }

  if (min !== null && max !== null && min > max) {
    return { ok: false, error: "Your minimum can't be higher than your maximum." };
  }

  return OK;
}

// ISO 3166 common names. A fixed list is the only way to stop "Xyzland" —
// shape validation can't tell a real country from a made-up one.
export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina",
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada",
  "Cape Verde", "Central African Republic", "Chad", "Chile", "China",
  "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "DR Congo", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea",
  "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Macau", "Madagascar", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
  "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
  "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Lucia", "Samoa", "San Marino", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo",
  "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
] as const;

// Fixed list, so nobody can type junk into a field that's meant to be data you
// filter on. "Other" is the escape hatch.
export const LANGUAGES = [
  "English",
  "Greek",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Polish",
  "Romanian",
  "Turkish",
  "Russian",
  "Ukrainian",
  "Arabic",
  "Hindi",
  "Urdu",
  "Bengali",
  "Mandarin",
  "Cantonese",
  "Japanese",
  "Korean",
  "Vietnamese",
  "Thai",
  "Tagalog",
  "Indonesian",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Czech",
  "Hungarian",
  "Bulgarian",
  "Serbian",
  "Croatian",
  "Albanian",
  "Hebrew",
  "Persian",
  "Swahili",
  "Other",
] as const;

export function checkLanguages(values: string[]): CheckResult {
  const allowed = new Set<string>(LANGUAGES);
  const bad = values.find((v) => !allowed.has(v));
  if (bad) {
    return { ok: false, error: "Pick your languages from the list." };
  }
  if (values.length > 10) {
    return { ok: false, error: "Pick up to 10 languages." };
  }
  return OK;
}

/** Brand names: allows digits and & so "H&M" and "Nike23" pass. */
export function checkBrands(values: string[]): CheckResult {
  if (values.length > 30) {
    return { ok: false, error: "That's too many brands — list your best 30." };
  }
  for (const b of values) {
    if (b.length > 60) {
      return { ok: false, error: `"${b.slice(0, 20)}…" is too long for a brand name.` };
    }
    const result = checkText(b, { label: `"${b}"` });
    if (!result.ok) return result;
  }
  return OK;
}
