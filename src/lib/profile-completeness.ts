import type { Applicant, ApplicantHandle } from "@/lib/database.types";

// Profile completeness, borrowed as a *pattern* from how gig marketplaces
// nudge freelancers to fill in their profiles. It exists for a practical
// reason here: a half-filled profile is worthless to you when deciding who
// goes on a campaign, and a percentage plus a concrete next step moves people
// far better than a wall of optional fields does.
//
// Weighted by what actually helps you choose someone — a portfolio link and a
// second platform matter more than a date of birth that's already required.

interface Criterion {
  key: string;
  label: string;
  /** Relative weight; the total is normalised to 100%. */
  weight: number;
  done: boolean;
  /** Where to go to fix it. */
  step: number;
}

export interface Completeness {
  percent: number;
  missing: { label: string; step: number }[];
  complete: boolean;
}

export function profileCompleteness(
  applicant: Applicant,
  handles: ApplicantHandle[],
): Completeness {
  const criteria: Criterion[] = [
    {
      key: "identity",
      label: "Your name and username",
      weight: 1,
      done: Boolean(applicant.name && applicant.username),
      step: 1,
    },
    {
      key: "location",
      label: "Where you're based",
      weight: 1,
      done: Boolean(applicant.location),
      step: 1,
    },
    {
      key: "handle",
      label: "At least one account",
      weight: 2,
      done: handles.length > 0,
      step: 2,
    },
    {
      key: "second_handle",
      label: "A second platform",
      weight: 1,
      done: handles.length > 1,
      step: 2,
    },
    {
      key: "followers",
      label: "Follower counts on your accounts",
      weight: 1,
      done: handles.some((h) => h.follower_count !== null),
      step: 2,
    },
    {
      key: "niche",
      label: "The niche you want to work in",
      weight: 1,
      done: Boolean(applicant.niche_interest_id),
      step: 2,
    },
    {
      key: "experience",
      label: "How long you've been creating",
      weight: 1,
      done: applicant.years_creating !== null,
      step: 3,
    },
    {
      key: "content_types",
      label: "The kind of content you make",
      weight: 2,
      done: applicant.content_types.length > 0,
      step: 3,
    },
    {
      key: "skills",
      label: "Your skills",
      weight: 1,
      done: applicant.skills.length > 0,
      step: 3,
    },
    {
      key: "rate",
      label: "Your rate range",
      weight: 2,
      done:
        applicant.preferred_pay_min !== null ||
        applicant.preferred_pay_max !== null,
      step: 4,
    },
    {
      key: "languages",
      label: "Languages you create in",
      weight: 1,
      done: applicant.languages.length > 0,
      step: 4,
    },
    {
      key: "bio",
      label: "A short bio",
      weight: 2,
      done: Boolean(applicant.bio),
      step: 5,
    },
    {
      key: "portfolio",
      label: "A link to your best work",
      weight: 3,
      done: Boolean(applicant.portfolio_url),
      step: 5,
    },
  ];

  const total = criteria.reduce((sum, c) => sum + c.weight, 0);
  const earned = criteria
    .filter((c) => c.done)
    .reduce((sum, c) => sum + c.weight, 0);

  const percent = Math.round((earned / total) * 100);

  return {
    percent,
    // Heaviest gaps first, so the suggested next step is the highest-value one.
    missing: criteria
      .filter((c) => !c.done)
      .sort((a, b) => b.weight - a.weight)
      .map((c) => ({ label: c.label, step: c.step })),
    complete: percent === 100,
  };
}
