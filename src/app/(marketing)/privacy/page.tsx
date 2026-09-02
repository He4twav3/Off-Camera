import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { DiscordLink } from "@/components/site/discord-link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${siteConfig.name}.`,
  robots: { index: false, follow: true },
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="August 31, 2026"
      intro={
        <>
          This Privacy Policy explains what information {siteConfig.name},
          operated by OnCamera DOO, collects and how it&apos;s used.
        </>
      }
    >
      <h2>1. Information we collect</h2>
      <ul>
        <li>Contact details you provide at checkout (name, email address).</li>
        <li>
          Payment information, processed by our payment provider. We
          don&apos;t store full card numbers ourselves.
        </li>
        <li>
          Usage data (pages visited, lessons completed) to track your
          course progress.
        </li>
        <li>Basic analytics data (device, browser, approximate location).</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To give you access to the course and track your progress.</li>
        <li>To send purchase confirmations, updates, and support replies.</li>
        <li>To improve the course content and this website.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>3. Third parties</h2>
      <p>
        We share data only with the services required to operate the
        course, for example our payment processor. They have their own
        privacy policy governing the data they process.
      </p>

      <h2>4. Cookies</h2>
      <p>
        We use essential cookies to keep you signed in. We don&apos;t
        currently use analytics or tracking cookies; if that changes,
        we&apos;ll update this policy first.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We retain account and purchase data for as long as needed to
        provide the course and meet legal/accounting obligations.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access,
        correct, or delete your personal data. Contact us to make a
        request.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about this policy can be sent to us on{" "}
        <DiscordLink>Discord</DiscordLink>.
      </p>
    </LegalPage>
  );
}
