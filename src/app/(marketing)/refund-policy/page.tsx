import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { DiscordLink } from "@/components/site/discord-link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `Refund Policy for ${siteConfig.name}.`,
  robots: { index: false, follow: true },
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      lastUpdated="October 11, 2026"
      intro={
        <>
          This Refund Policy explains how purchases of {siteConfig.name},
          operated by OnCamera DOO, are handled.
        </>
      }
    >
      <h2>7-day refund window</h2>
      <p>
        All 8 modules unlock the moment you complete checkout, but if{" "}
        {siteConfig.name} isn&apos;t a fit, contact us on{" "}
        <DiscordLink>Discord</DiscordLink> within 7 days of your purchase
        for a full refund, no questions asked. After 7 days, purchases are
        final.
      </p>

      <h2>What this covers</h2>
      <p>
        This policy is for purchases of the course. Payments between brands and
        creators are made directly between them, so a refund of a campaign
        payment is a matter between the brand and the creator. See our{" "}
        <Link href="/terms">Terms</Link> for how those payments work.
      </p>

      <h2>Before you buy</h2>
      <p>
        The intro video and full curriculum are on the{" "}
        <Link href="/course#curriculum">main site</Link> so you can take a proper
        look before you enroll — the refund window is a safety net, not a
        replacement for checking the course is right for you first.
      </p>

      <h2>Billing issues</h2>
      <p>
        Charged twice, or can&apos;t access your account after paying?
        Message us on <DiscordLink>Discord</DiscordLink> with your
        purchase email and we&apos;ll sort it out.
      </p>

      <h2>Questions</h2>
      <p>
        Reach out any time at{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>{" "}
        or on <DiscordLink>Discord</DiscordLink>.
      </p>
    </LegalPage>
  );
}
