import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { DiscordLink } from "@/components/site/discord-link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${siteConfig.name}.`,
  robots: { index: false, follow: true },
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated="August 31, 2026"
      intro={
        <>
          These Terms of Service (&ldquo;Terms&rdquo;) govern access to and
          use of {siteConfig.name} (the &ldquo;Course&rdquo;), operated by
          OnCamera DOO (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By purchasing
          or accessing the Course, you agree to these Terms.
        </>
      }
    >
      <h2>1. What you&apos;re buying</h2>
      <p>
        Purchasing {siteConfig.name} grants you a personal, non-transferable,
        lifetime license to access the course content for your own
        educational use. You may not resell, redistribute, or publicly
        share course materials.
      </p>

      <h2>2. No guaranteed results</h2>
      <p>
        The Course teaches strategies and methods based on the
        instructor&apos;s own experience. Results vary by effort, market,
        platform algorithm changes, and factors outside our control. We do
        not guarantee any specific income, follower count, or brand deal
        outcome.
      </p>

      <h2>3. Payment &amp; access</h2>
      <p>
        The Course is sold as a one-time payment of{" "}
        {siteConfig.price.formatted} for lifetime access, unless otherwise
        stated at checkout. Access may be provided directly or through a
        third-party marketplace platform, in which case that
        platform&apos;s terms also apply.
      </p>

      <h2>4. Your account</h2>
      <p>
        Signing in creates a session tied to the email address you provide.
        You&apos;re responsible for keeping access to that email secure;
        activity under your account is treated as yours.
      </p>

      <h2>5. Refunds</h2>
      <p>
        See our{" "}
        <a href="/refund-policy">Refund Policy</a> for how purchases are
        handled.
      </p>

      <h2>6. Acceptable use</h2>
      <ul>
        <li>No sharing of login credentials or paid content with non-purchasers.</li>
        <li>No reproducing, reselling, or repackaging course materials.</li>
        <li>No abusive conduct toward staff or other students in community spaces.</li>
      </ul>
      <p>
        We may suspend access for accounts that violate these terms.
      </p>

      <h2>7. Changes to the Course</h2>
      <p>
        We may update, add to, or restructure course content over time.
        Purchasers retain access to the current version of the Course under
        their lifetime license.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, OnCamera DOO is not liable
        for indirect, incidental, or consequential damages arising from use
        of the Course.
      </p>

      <h2>9. Governing law</h2>
      <p>These Terms are governed by the laws of North Macedonia.</p>

      <h2>10. Contact</h2>
      <p>
        Questions about these Terms can be sent to us on{" "}
        <DiscordLink>Discord</DiscordLink>.
      </p>
    </LegalPage>
  );
}
