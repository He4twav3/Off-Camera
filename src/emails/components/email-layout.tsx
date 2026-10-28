import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { siteConfig } from "@/lib/site-config";

/**
 * Shared branded shell for every transactional email this site sends
 * (see lib/mailer.ts). Built with @react-email components specifically
 * because hand-rolled email HTML is a real minefield (Outlook's Word
 * rendering engine, Gmail stripping <style> blocks, etc.) — this handles
 * that instead of guessing at it.
 *
 * THE PALETTE IS dark-invert.css's, NOT globals.css's :root — the first
 * version of this file matched the light-theme tokens instead, which
 * looked reasonable in isolation but is not what the site actually shows
 * anyone: every real visit renders through `.dark-invert` (see
 * layout.tsx), so the light `:root` values are colors nobody has ever
 * seen on this site. Literal hex, copied straight from dark-invert.css's
 * own agreed literals (not re-derived), so there's no drift between what
 * that file says the brand looks like and what this one renders:
 *   background #16151A · card #1D1C22 · ink/border #EDEAE4 (cream, flips
 *   light-on-dark same as dark-invert.css's own --ink note) · accent
 *   #AC0216 (flat crimson — "the only chroma on the page" there, and the
 *   only one here) · muted text #706C68.
 *
 * Deliberately not trying to replicate the site's hard-shadow "sticker"
 * look here: box-shadow support in email clients is unreliable enough
 * that a shadow silently not rendering would just look like a mistake,
 * whereas a plain 2px ink-colored border (used throughout) renders
 * everywhere and still reads as the same "chunky outline" identity —
 * same reasoning dark-invert.css's own header note gives for why --ink
 * has to flip to cream on a dark ground rather than staying near-black:
 * an outline has to out-contrast the surface it's outlining.
 *
 * THE LOGO. A fixed production URL (EMAIL_ASSET_BASE_URL below), not
 * `siteConfig.url` — that value tracks NEXT_PUBLIC_SITE_URL, which is
 * `http://localhost:3000` while testing locally, and Gmail's own servers
 * physically cannot fetch an image off someone's laptop. A decorative
 * brand asset has no reason to depend on wherever the send happened to
 * be triggered from; the actual sign-in/reset LINKS still correctly use
 * the request's real host (see request-url.ts) since those genuinely do
 * need to match wherever the visitor is testing from. SVG in an `<img>`
 * renders fine in Gmail, Apple/iOS Mail and most mobile clients;
 * Outlook desktop's older rendering engine is the one real holdout and
 * falls back to the `alt` text instead of a broken-image icon.
 */
// www, not the bare domain — oncameraugc.com 308-redirects to
// www.oncameraugc.com at the DNS/hosting level, and email image proxies
// (some more than others) aren't guaranteed to follow that redirect the
// way a browser would. Pointing at the canonical URL directly skips the
// hop entirely instead of hoping every client chases it.
const EMAIL_ASSET_BASE_URL = "https://www.oncameraugc.com";

const colors = {
  background: "#16151a",
  card: "#16151a",
  ink: "#edeae4",
  accent: "#ac0216",
  accentForeground: "#ffffff",
  border: "#2d2b32",
  mutedForeground: "#706c68",
};

/**
 * "plain" is an ordinary email: no background of its own (the inbox's own white, or its dark mode), dark text,
 * and the dark logo with a thin white edge so it shows on either. Pass `plain` to the helpers below as well.
 */
const PLAIN = {
  ink: "#16151a",
  text: "#3f3c44",
  muted: "#8a8690",
  rule: "#e6e4e0",
};

export function EmailLayout({
  preview,
  plain = false,
  children,
}: {
  /** Preview text shown in inbox lists (Gmail, Apple Mail) before the
   * email is opened — not visible in the body itself. */
  preview: string;
  plain?: boolean;
  children: ReactNode;
}) {
  if (plain)
    return (
        <Html>
          <Head />
          <Preview>{preview}</Preview>
          <Body style={{ margin: 0, padding: "40px 16px" }}>
            <Container style={{ maxWidth: 480, margin: "0 auto" }}>
              <Section style={{ padding: "8px 32px 0", textAlign: "center" }}>
                <Img
                  src={`${EMAIL_ASSET_BASE_URL}/email/logo-mark-light.png`}
                  width={64}
                  height={64}
                  alt="OnCamera"
                  style={{ display: "block", margin: "0 auto" }}
                />
              </Section>
              <Section style={{ padding: "24px 32px 32px" }}>{children}</Section>
              <Hr style={{ borderColor: PLAIN.rule, margin: 0 }} />
              <Section style={{ padding: "18px 32px", textAlign: "center" }}>
                <Text style={{ margin: 0, fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif", fontSize: 12, color: PLAIN.muted }}>
                  <Link href={siteConfig.url} style={{ color: PLAIN.muted }}>
                    {siteConfig.url.replace(/^https?:\/\//, "")}
                  </Link>
                </Text>
              </Section>
            </Container>
          </Body>
        </Html>
    );
  return (
    <Html style={{ backgroundColor: colors.background }}>
      <Head>
        {/* Tell iOS Mail / Apple Mail this email already handles dark mode
            so it doesn't re-colour it, and give clients that ignore the
            meta tags the same hint in CSS. */}
        <meta name="color-scheme" content="dark light" />
        <meta name="supported-color-schemes" content="dark light" />
        <style>{`:root{color-scheme:dark light;supported-color-schemes:dark light;}`}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        {...{ bgcolor: colors.background }}
        style={{ backgroundColor: colors.background, margin: 0, padding: "40px 16px" }}
      >
        <Container
          {...{ bgcolor: colors.card }}
          style={{
            maxWidth: 480,
            margin: "0 auto",
            backgroundColor: colors.card,
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <Section {...{ bgcolor: colors.card }} style={{ padding: "36px 32px 0", textAlign: "center", backgroundColor: colors.card }}>
            {/* The viewfinder mark only, white with the crimson tally.
                Drawn 4x (336px) and shown at 84px so it stays sharp on
                retina phones. The PNG has the same solid #16151a as the
                card behind it — invisible on the dark card, and if a mail
                client drops the card colour it still reads as a dark tile
                instead of vanishing into white. Regenerate
                public/email/logo-mark.png if the mark ever changes. */}
            <Img
              src={`${EMAIL_ASSET_BASE_URL}/email/logo-mark.png`}
              width={84}
              height={84}
              alt="OnCamera"
              style={{ display: "block", margin: "0 auto" }}
            />
          </Section>

          <Section {...{ bgcolor: colors.card }} style={{ padding: "24px 40px 40px", backgroundColor: colors.card }}>{children}</Section>

          <Hr style={{ borderColor: colors.border, margin: 0 }} />
          <Section {...{ bgcolor: colors.card }} style={{ padding: "18px 32px", textAlign: "center", backgroundColor: colors.card }}>
            <Text
              style={{
                margin: 0,
                fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif",
                fontSize: 12,
                color: colors.mutedForeground,
              }}
            >
              <Link href={siteConfig.url} style={{ color: colors.mutedForeground }}>
                {siteConfig.url.replace(/^https?:\/\//, "")}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailHeading({
  children,
  align = "left",
  plain = false,
}: {
  children: ReactNode;
  align?: "left" | "center";
  plain?: boolean;
}) {
  return (
    <Heading
      style={{
        margin: "0 0 12px",
        // The site's real body headings are DM Sans, not a serif — this
        // was Georgia before, which put every email's biggest piece of
        // text in the one typeface family (serif) nothing else on the
        // site uses anywhere. System sans instead, same stack the body
        // text below it already uses (see EmailText), just bolder —
        // agrees with the actual site instead of inventing its own look.
        fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif",
        fontWeight: 700,
        fontSize: 24,
        color: plain ? PLAIN.ink : colors.ink,
        textAlign: align,
      }}
    >
      {children}
    </Heading>
  );
}

export function EmailText({
  children,
  align = "left",
  plain = false,
}: {
  children: ReactNode;
  align?: "left" | "center";
  plain?: boolean;
}) {
  return (
    <Text
      style={{
        margin: "0 0 20px",
        fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif",
        fontSize: 15,
        lineHeight: "1.6",
        color: plain ? PLAIN.text : colors.mutedForeground,
        textAlign: align,
      }}
    >
      {children}
    </Text>
  );
}

export function EmailButton({
  href,
  children,
  align = "left",
  tone = "accent",
  plain = false,
}: {
  href: string;
  children: ReactNode;
  align?: "left" | "center";
  plain?: boolean;
  /** "quiet" is a small pill with no outline (cream on the dark layout, dark on a plain one), for an email that shouldn't shout. */
  tone?: "accent" | "quiet";
}) {
  const quiet = tone === "quiet";
  // On a plain email the quiet pill turns dark with white text, so it stands out on white.
  const fill = quiet ? (plain ? PLAIN.ink : colors.ink) : colors.accent;
  const label = quiet ? (plain ? "#ffffff" : colors.background) : colors.accentForeground;
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      align={align}
      style={{ margin: align === "center" ? "4px auto 8px" : "4px 0 24px" }}
    >
      <tr>
        <td
          {...{ bgcolor: fill }}
          style={{
            backgroundColor: fill,
            // On a plain email a white edge: unseen on a white inbox, and it keeps the dark pill visible in dark mode.
            border: quiet ? (plain ? "1px solid #ffffff" : "none") : `2px solid ${colors.ink}`,
            borderRadius: 999,
          }}
        >
          <Link
            href={href}
            style={{
              display: "inline-block",
              padding: quiet ? "9px 22px" : "12px 28px",
              fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif",
              fontWeight: quiet ? 600 : 700,
              fontSize: quiet ? 14 : 15,
              color: label,
              textDecoration: "none",
            }}
          >
            {children}
          </Link>
        </td>
      </tr>
    </table>
  );
}

export function EmailLinkFallback({ href }: { href: string }) {
  return (
    <Text
      style={{
        margin: 0,
        fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif",
        fontSize: 12,
        color: colors.mutedForeground,
        wordBreak: "break-all",
      }}
    >
      Or paste this link into your browser:{" "}
      <Link href={href} style={{ color: colors.mutedForeground }}>
        {href}
      </Link>
    </Text>
  );
}

/** Small print — disclaimers and "why you got this" lines. 12px, muted. */
export function EmailFinePrint({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <Text
      style={{
        margin: "0 0 10px",
        fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif",
        fontSize: 12,
        lineHeight: "1.6",
        color: colors.mutedForeground,
        textAlign: align,
      }}
    >
      {children}
    </Text>
  );
}
