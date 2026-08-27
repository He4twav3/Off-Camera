import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
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
      lastUpdated="[Month Day, Year]"
      intro={
        <>
          This page is placeholder content for a demo build. Replace the
          bracketed sections with your actual policy and have it reviewed
          before going live.
        </>
      }
    >
      <h2>Purchases are final</h2>
      <p>
        All 8 modules unlock the moment you complete checkout. Because
        access is instant and complete, purchases of {siteConfig.name} are
        final once your payment is processed.
      </p>

      <h2>Before you buy</h2>
      <p>
        The intro video and full curriculum are on the{" "}
        <Link href="/#curriculum">main site</Link> for exactly this reason: take a
        proper look before you enroll, the same way you would with any
        one-time purchase.
      </p>

      <h2>Billing issues</h2>
      <p>
        Charged twice, or can&apos;t access your account after paying?
        Email {siteConfig.contactEmail} with your purchase email and
        we&apos;ll sort it out.
      </p>

      <h2>Purchases through a marketplace</h2>
      <p>
        If you purchased through a third-party marketplace (Whop, Gumroad,
        or similar), that platform&apos;s own policies apply. Start there,
        and reach out to us if you get stuck.
      </p>

      <h2>Questions</h2>
      <p>
        Reach out any time at{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>
          {siteConfig.contactEmail}
        </a>
        .
      </p>
    </LegalPage>
  );
}
