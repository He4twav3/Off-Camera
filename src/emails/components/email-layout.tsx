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
  card: "#1d1c22",
  ink: "#edeae4",
  accent: "#ac0216",
  accentForeground: "#ffffff",
  border: "#2d2b32",
  mutedForeground: "#706c68",
};

export function EmailLayout({
  preview,
  children,
}: {
  /** Preview text shown in inbox lists (Gmail, Apple Mail) before the
   * email is opened — not visible in the body itself. */
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.background, margin: 0, padding: "40px 16px" }}>
        <Container
          style={{
            maxWidth: 480,
            margin: "0 auto",
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          <Section style={{ padding: "40px 32px 8px", textAlign: "center" }}>
            {/* PNG, not the site's icon.svg: Gmail doesn't render SVG in
                <img>, and icon.svg also adapts to prefers-color-scheme,
                which an inbox can't be trusted to match. public/email/
                logo.png is the same viewfinder mark in cream + crimson on
                a transparent ground, drawn for this dark card. */}
            <Img
              src={`${EMAIL_ASSET_BASE_URL}/email/logo.png`}
              width={56}
              height={56}
              alt="OnCamera"
              style={{ display: "block", margin: "0 auto" }}
            />
            <Text
              style={{
                margin: "12px 0 0",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "0.02em",
                color: colors.ink,
              }}
            >
              OnCamera
            </Text>
          </Section>

          <Section style={{ padding: "24px 40px 40px" }}>{children}</Section>

          <Hr style={{ borderColor: colors.border, margin: 0 }} />
          <Section style={{ padding: "18px 32px", textAlign: "center" }}>
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
}: {
  children: ReactNode;
  align?: "left" | "center";
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
        color: colors.ink,
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
}: {
  children: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <Text
      style={{
        margin: "0 0 20px",
        fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif",
        fontSize: 15,
        lineHeight: "1.6",
        color: colors.mutedForeground,
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
}: {
  href: string;
  children: ReactNode;
  align?: "left" | "center";
}) {
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
          style={{
            backgroundColor: colors.accent,
            border: `2px solid ${colors.ink}`,
            borderRadius: 999,
          }}
        >
          <Link
            href={href}
            style={{
              display: "inline-block",
              padding: "12px 28px",
              fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: colors.accentForeground,
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
