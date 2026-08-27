import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
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
                <td style={{ paddingRight: 8 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      backgroundColor: colors.primary,
                      border: `1px solid ${colors.ink}`,
                    }}
                  />
                </td>
                <td>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: colors.ink,
                    }}
                  >
                    Off Camera
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
              Off Camera · The content system behind videos that perform.{" "}
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
        fontFamily: "Georgia, 'Times New Roman', serif",
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
