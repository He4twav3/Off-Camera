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
      lastUpdated="October 11, 2026"
      intro={
        <>
          This Privacy Policy explains what information {siteConfig.name},
          operated by OnCamera DOO, collects from creators, brands and course
          students, and how it&apos;s used.
        </>
      }
    >
      <h2>1. Information we collect</h2>
      <p>
        <strong>Everyone with an account</strong>
      </p>
      <ul>
        <li>Your name, email address, username and profile picture.</li>
        <li>
          If you connect Discord, your Discord name. We do not read your
          messages.
        </li>
      </ul>
      <p>
        <strong>Creators</strong>
      </p>
      <ul>
        <li>
          The social accounts you connect and verify, your niches and the
          sample videos you add.
        </li>
        <li>
          Your payout link (Stripe or Wise). Brands who owe you a payment can
          see it so they can pay you.
        </li>
        <li>
          The posts you submit to a campaign, and the public data about them:
          the platform, the link, the views and when it went live.
        </li>
        <li>
          Records of what you earned, the statements issued, and the dates a
          brand marked a payment as made and you confirmed it.
        </li>
        <li>
          Your agreement to a brand&apos;s contract: that you agreed, when, and
          to which version.
        </li>
      </ul>
      <p>
        <strong>Brands</strong>
      </p>
      <ul>
        <li>Your company name, contact name and website.</li>
        <li>
          The details you give in a campaign&apos;s contract: the
          company&apos;s legal name, address and country, and the name and role
          of the person who agreed, with the date and your sign-in email.
        </li>
        <li>
          Your campaigns, your approvals and denials of videos, and the dates
          you marked payments as made.
        </li>
      </ul>
      <p>
        <strong>Everyone</strong>
      </p>
      <ul>
        <li>
          Course purchases: payment information is processed by our payment
          providers. We don&apos;t store full card numbers ourselves.
        </li>
        <li>Course progress, so we can show you where you left off.</li>
        <li>
          Basic technical data (device, browser, approximate location) and
          essential cookies that keep you signed in.
        </li>
      </ul>
      <p>
        We do not collect payment card numbers or bank logins for brand-to-creator
        payments. Those happen directly between the brand and the creator on
        Stripe or Wise.
      </p>

      <h2>2. How we use it</h2>
      <ul>
        <li>To run your account and the campaigns you take part in.</li>
        <li>
          To check videos, read view counts, work out what is owed, and prepare
          statements, contracts and invoices.
        </li>
        <li>
          To send emails about your account, payments, statements and videos
          waiting for approval, and to reply to support requests.
        </li>
        <li>To keep the platform safe and to prevent fake accounts and fake views.</li>
        <li>To improve the platform and this website.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>3. Who can see what</h2>
      <ul>
        <li>
          <strong>Brands</strong> see the creators on their own campaigns: name,
          username, connected accounts, posts, views and what they earned and
          were paid. A brand only sees a creator&apos;s payout link when a
          payment to that creator is due.
        </li>
        <li>
          <strong>Creators</strong> see the campaigns they can join. After
          joining, a creator sees the brand&apos;s name and the contract with
          the brand&apos;s company details.
        </li>
        <li>
          <strong>Our team</strong> can see accounts, campaigns, payments and
          contracts in order to run the platform.
        </li>
      </ul>

      <h2>4. Services we use</h2>
      <p>
        We share data only with the services needed to run the platform. They
        have their own privacy policies governing the data they process.
      </p>
      <ul>
        <li>Supabase, for our database and sign-in.</li>
        <li>Vercel, for hosting the website.</li>
        <li>Resend, for sending emails.</li>
        <li>
          YouTube, TikTok, Instagram and the data providers we use to read
          public view counts and cover images of posts you submit.
        </li>
        <li>Discord, if you choose to connect your account.</li>
        <li>
          Our payment providers, for course purchases. Payments between brands
          and creators use Stripe or Wise directly, under their own terms.
        </li>
      </ul>

      <h2>5. Cookies</h2>
      <p>
        We use essential cookies to keep you signed in. We don&apos;t currently
        use analytics or tracking cookies; if that changes, we&apos;ll update
        this policy first.
      </p>

      <h2>6. How long we keep it</h2>
      <p>
        We keep account data for as long as your account exists. Records of
        campaigns, statements, payments and contracts may be kept for as long
        as needed to settle payments, resolve disputes and meet legal and
        accounting obligations, even after an account is closed.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access,
        correct, export or delete your personal data, or to object to how we
        use it. Contact us to make a request. Some records, such as payment and
        contract records, may have to be kept, and we will tell you if so.
      </p>

      <h2>8. Where data is processed</h2>
      <p>
        Our services may process data in countries other than your own. We use
        providers that protect it with appropriate safeguards.
      </p>

      <h2>9. Changes</h2>
      <p>
        If we change this policy in a way that matters, we will update the date
        above and, where it affects how we use your data, tell you.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about this policy can be sent to us on{" "}
        <DiscordLink>Discord</DiscordLink>.
      </p>
    </LegalPage>
  );
}
