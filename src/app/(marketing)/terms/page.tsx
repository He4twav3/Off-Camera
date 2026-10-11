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
      lastUpdated="October 11, 2026"
      intro={
        <>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of{" "}
          {siteConfig.name}, operated by OnCamera DOO (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;). {siteConfig.name} has two parts: a platform where
          brands and creators work together on paid campaigns, and a course.
          By creating an account, joining a campaign or buying the course, you
          agree to these Terms.
        </>
      }
    >
      <h2>1. What we do</h2>
      <p>
        We run a platform that connects brands with creators. Brands post
        campaigns and set the pay. Creators join a campaign, post videos on
        their own social accounts, and are paid by the brand. We check videos,
        read view counts from the platforms, keep the records, and prepare the
        statements and contracts.
      </p>
      <p>
        We are not a party to the work or the payment between a brand and a
        creator, and we are not anyone&apos;s employer.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>
          You can sign up as a creator or as a brand. Give accurate details and
          keep your login secure; activity under your account is treated as
          yours.
        </li>
        <li>
          Brand accounts are reviewed before they can post campaigns, and we
          may decline or remove an account.
        </li>
        <li>
          You must be able to enter into a binding agreement where you live.
        </li>
      </ul>

      <h2>3. How money moves</h2>
      <ul>
        <li>
          <strong>We do not hold or send creators&apos; money.</strong> When a
          payment is due, the brand pays the creator directly, through the
          payment link the creator saved (Stripe or Wise), from the
          brand&apos;s own account.
        </li>
        <li>
          Creators are paid the full amount shown on the statement. Nothing is
          taken out of it. The brand pays any transfer or conversion fees so
          the creator receives all of it. Amounts are in US dollars.
        </li>
        <li>
          The brand marks the statement as paid, and the creator confirms they
          received it. A creator should confirm only once the money has
          arrived, and should tell us if it hasn&apos;t.
        </li>
        <li>
          Our own fee is agreed with each brand and invoiced to the brand
          separately. Creators do not pay it and do not see it.
        </li>
        <li>
          Because the brand pays the creator directly, we are not responsible
          for a payment a brand does not make. We will help sort it out and
          may pause a brand&apos;s campaigns until it is settled.
        </li>
      </ul>

      <h2>4. For creators</h2>
      <ul>
        <li>
          Connect and verify at least one of your own social accounts before
          you join a campaign. Posts only count when they are on an account
          you have verified, and go live after you joined the campaign.
        </li>
        <li>
          Each campaign sets its own pay, usually a base amount per unique
          video and pay for views. Views are read from the platforms about
          once a day, only views inside the campaign&apos;s counting window
          count, and then the number is final.
        </li>
        <li>
          Videos must be your own, new work that follows the campaign&apos;s
          rules. No reposting the same video to collect pay twice, no bulk
          posting to fill the count, and only music, images and fonts you have
          the right to use.
        </li>
        <li>
          Label posts as a paid partnership where the law or the platform
          requires it, and keep each post public for the time the campaign
          sets.
        </li>
        <li>
          We do not guarantee any earnings. What you earn depends on your
          videos, your views and the campaign&apos;s terms.
        </li>
      </ul>

      <h2>5. For brands</h2>
      <ul>
        <li>
          You are responsible for the campaign you post: the brief, the pay
          terms and anything you ask creators to say or show. Do not ask
          creators for anything unlawful or misleading.
        </li>
        <li>
          You choose whether OnCamera approves each video or you do. A video is
          only counted towards what you owe once it has been approved, and you
          can deny a video that breaks the rules.
        </li>
        <li>
          When a statement is issued, pay the creator the full amount by its
          due date, cover the transfer fees, then mark it as paid.
        </li>
        <li>
          You pay our fee as agreed with us, on the invoice we send.
        </li>
        <li>
          Changing a campaign&apos;s pay terms after creators have joined
          affects what they earn from then on, and you will be asked to agree
          to the contract again.
        </li>
      </ul>

      <h2>6. Contracts between brands and creators</h2>
      <p>
        Each campaign has a contract between the brand and the creators who
        join it. The brand fills in its company details and agrees to it before
        it can use its account. A creator reads it and agrees to it when they
        join, and again if the brand changes it. We keep a record of who agreed
        to which version and when. The contract describes the work, the pay,
        how and when the brand pays, and the content rules, and it is the
        agreement that applies to the campaign.
      </p>

      <h2>7. Content and rights</h2>
      <p>
        You keep ownership of the videos you make. What a brand may do with a
        video, and for how long, is set out in the campaign&apos;s contract. By
        posting content through the platform you confirm that you have the
        rights to it and that it does not infringe anyone else&apos;s rights.
        We may show a campaign&apos;s videos to the brand and, where the
        campaign allows, link to them as examples.
      </p>

      <h2>8. The course</h2>
      <p>
        Buying {siteConfig.name} gives you a personal, non-transferable,
        lifetime license to access the course content for your own educational
        use. You may not resell, redistribute, or publicly share course
        materials. The course is sold as a one-time payment of{" "}
        {siteConfig.price.formatted} for lifetime access, unless stated
        otherwise at checkout, and may be provided directly or through a
        third-party marketplace whose own terms also apply. See our{" "}
        <a href="/refund-policy">Refund Policy</a> for how course purchases are
        handled. The course teaches methods from the instructor&apos;s own
        experience, and results vary. We do not guarantee any income,
        follower count or brand deal.
      </p>

      <h2>9. Acceptable use</h2>
      <ul>
        <li>No fake accounts, fake views, or other ways of inflating results.</li>
        <li>No sharing of login credentials or paid course content.</li>
        <li>No reproducing, reselling or repackaging course materials.</li>
        <li>No harassment of staff, brands, creators or other members.</li>
      </ul>
      <p>
        We may reject a video, remove a post from the count, suspend an
        account, or close a campaign that breaks these Terms or a
        campaign&apos;s rules. Where money is already owed for approved work,
        it stays owed.
      </p>

      <h2>10. Changes to the platform and the Terms</h2>
      <p>
        We may update the platform, the course and these Terms over time. If a
        change materially affects you, we will tell you or update the date
        above before it applies. Pay terms already agreed for a campaign are
        not changed by an update to these Terms.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, OnCamera DOO is not liable for
        indirect, incidental or consequential damages, for payments owed
        between a brand and a creator, or for the actions of brands or
        creators. Nothing in these Terms limits liability that cannot be
        limited by law.
      </p>

      <h2>12. Governing law</h2>
      <p>These Terms are governed by the laws of North Macedonia.</p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>, or to us on{" "}
        <DiscordLink>Discord</DiscordLink>.
      </p>
    </LegalPage>
  );
}
