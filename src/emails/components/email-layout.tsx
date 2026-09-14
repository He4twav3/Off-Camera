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
 * (see lib/mailer.ts) — same palette as the live site's :root tokens in
 * globals.css, resolved to plain hex since email clients don't
 * understand oklch()/CSS variables at all. Built with @react-email
 * components specifically because hand-rolled email HTML is a real
 * minefield (Outlook's Word rendering engine, Gmail stripping <style>
 * blocks, etc.) — this handles that instead of guessing at it.
 *
 * Deliberately not trying to replicate the site's hard-shadow "sticker"
 * look here: box-shadow support in email clients is unreliable enough
 * that a shadow silently not rendering would just look like a mistake,
 * whereas a plain 2px ink border (used throughout) renders everywhere
 * and still reads as the same "chunky outline" identity.
 *
 * THE LOGO. `${siteConfig.url}/icon.svg` — the real viewfinder mark
 * (brand-mark.tsx's shape, baked into the site's own favicon route by
 * Next's file convention, so this is the actual production asset, not a
 * copy that can drift out of sync with it), not the plain colored dot
 * this used to be. Referenced by absolute URL rather than inlined:
 * email clients need images hosted somewhere they can fetch, and an
 * inline `<svg>` gets stripped by several of them entirely. SVG in an
 * `<img>` renders fine in Gmail, Apple/iOS Mail and most mobile clients;
 * Outlook desktop's older rendering engine is the one real holdout and
 * falls back to the `alt` text instead of a broken-image icon — the
 * same graceful-degradation approach the rest of this codebase already
 * takes with unavailable features, not a special case invented for this.
 */
const colors = {
  background: "#fdf9f4",
  card: "#fffffc",
  ink: "#120c09",
  primary: "#e14d28",
  primaryForeground: "#fefbf8",
  border: "#e2d5cb",
  mutedForeground: "#675b54",
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
            border: `2px solid ${colors.ink}`,
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <Section style={{ padding: "24px 32px", borderBottom: `1px solid ${colors.border}` }}>
            <table role="presentation" cellPadding={0} cellSpacing={0}>
              <tr>
                <td style={{ paddingRight: 10 }}>
                  <Img
                    src={`${siteConfig.url}/icon.svg`}
                    width={22}
                    height={22}
                    alt="OnCamera"
                    style={{ display: "block", borderRadius: 5 }}
                  />
                </td>
                <td>
                  {/* Bold system sans, not the site's own Bespoke
                      Stencil wordmark face — @font-face support in email
                      is unreliable enough (no Gmail/Outlook support at
                      all) that shipping the real font would just mean
                      most inboxes silently fall back anyway. A bold
                      sans-serif fallback at least agrees with the site's
                      actual identity on the one thing every client CAN
                      render: this is a blocky, sans-serif brand, not a
                      serif one — Georgia was never that, on any client. */}
                  <Text
                    style={{
                      margin: 0,
                      fontFamily:
                        "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontWeight: 800,
                      fontSize: 17,
                      letterSpacing: "-0.01em",
                      color: colors.ink,
                    }}
                  >
                    OnCamera
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          <Section style={{ padding: "32px" }}>{children}</Section>

          <Hr style={{ borderColor: colors.border, margin: 0 }} />
          <Section style={{ padding: "20px 32px" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif",
                fontSize: 12,
                color: colors.mutedForeground,
              }}
            >
              {/* siteConfig.tagline, not a copy of it — this line had
                  drifted to an old tagline ("The content system behind
                  videos that perform.") the live site no longer uses
                  anywhere, since it was hardcoded instead of reading the
                  same single source of truth every other tagline
                  mention on the site already does. */}
              {siteConfig.name} · {siteConfig.tagline}{" "}
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

export function EmailHeading({ children }: { children: ReactNode }) {
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
      }}
    >
      {children}
    </Heading>
  );
}

export function EmailText({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 20px",
        fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif",
        fontSize: 15,
        lineHeight: "1.6",
        color: colors.mutedForeground,
      }}
    >
      {children}
    </Text>
  );
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "4px 0 24px" }}>
      <tr>
        <td
          style={{
            backgroundColor: colors.primary,
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
              color: colors.primaryForeground,
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
