import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageShell, PageHeader, EmptyState } from "@/components/kit/ui";
import { CopyLinkButton } from "@/components/app/CopyLinkButton";
import { AFFILIATE_PROGRAMS, type AffiliateProgram } from "@/lib/affiliate-programs";
import { codeFor, type CodeResult } from "@/lib/affiliate-codes";
import { LinkForm } from "./LinkForm";

export const metadata: Metadata = { title: "Affiliates" };

/**
 * The affiliate programs of the campaigns you're on: your private partner code, how to sign up with it on the
 * brand's site, the link you get back, and what to say in your videos. A campaign you're not on shows nothing here.
 */
export default async function AffiliatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/recruiting/affiliates");

  const { data: applicant } = await supabase.from("applicants").select("id, name, email").eq("user_id", user.id).maybeSingle();
  if (!applicant) redirect("/dashboard/recruiting/profile-setup");

  const { data: assignments } = await supabase.from("assignments").select("id, jobs(id, title, about)").eq("applicant_id", applicant.id);
  const mine = AFFILIATE_PROGRAMS.map((program) => ({
    program,
    job: (assignments ?? []).map((a) => a.jobs).find((j) => j && program.matches(j)) ?? null,
  })).filter((p) => p.job);

  const results = await Promise.all(mine.map((p) => codeFor(p.program, applicant)));

  return (
    <PageShell>
      <PageHeader title="Affiliates" summary="Your partner codes and links for the campaigns you're on." />
      {mine.length === 0 ? (
        <EmptyState
          title="No affiliate programs yet"
          body="When you join a campaign with an affiliate program, your partner code and how to use it show up here."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {mine.map((p, i) => (
            <ProgramCard key={p.program.key} program={p.program} campaign={p.job!} result={results[i]} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function ProgramCard({ program, campaign, result }: { program: AffiliateProgram; campaign: { id: string; title: string }; result: CodeResult }) {
  const code = "code" in result ? result.code : null;
  return (
    <section className="rounded-xl border border-border/70 bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">{program.brand}</h2>
        <Link href={`/dashboard/recruiting/jobs/${campaign.id}`} className="text-sm text-muted-foreground underline underline-offset-2">
          {campaign.title}
        </Link>
      </div>
      <div className="mt-2 flex flex-col gap-1.5 text-[15px] leading-relaxed text-muted-foreground">
        {program.perks.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-foreground">Your partner code</p>
        {code ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="rounded-md bg-background px-3 py-1.5 font-mono text-lg font-semibold tracking-wide text-foreground">{code.code}</code>
            <CopyLinkButton url={code.code} label="Copy code" />
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            {"none" in result && result.none === "error"
              ? "We couldn't load your code just now. Refresh the page in a moment."
              : "Your code is on its way. We'll add it here shortly, so check back soon."}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          It&apos;s yours only and works once. Keep it private. It works until {program.expires}.
        </p>
      </div>

      <h3 className="mt-6 font-heading text-base font-semibold text-foreground">How to get your link</h3>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-muted-foreground">
        {program.steps.map((s, i) => (
          <li key={s}>
            {i === 0 ? (
              <a href={program.signupUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-2">
                {s} <ExternalLink className="inline size-3.5" />
              </a>
            ) : (
              s
            )}
          </li>
        ))}
      </ol>

      {code && (
        <div className="mt-5">
          <LinkForm program={program.key} saved={code.link ?? null} example={program.linkExample} />
          <p className="mt-1.5 text-xs text-muted-foreground">Paste it here once you have it, so we can see it next to your code.</p>
        </div>
      )}

      <h3 className="mt-6 font-heading text-base font-semibold text-foreground">What to say in your videos</h3>
      <p className="mt-2 rounded-lg bg-muted px-4 py-3 text-[15px] font-medium text-foreground">&ldquo;{program.say}&rdquo;</p>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{program.share}</p>

      <a
        href={program.guidePdf}
        download
        className="mt-5 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
      >
        <Download className="size-4" />
        Download the {program.brand} creator guide (PDF)
      </a>
    </section>
  );
}
