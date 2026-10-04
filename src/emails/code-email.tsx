import { Text } from "@react-email/components";
import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailFinePrint,
} from "./components/email-layout";

/**
 * The sign-up verification code (see lib/email-code.ts). Same card as every
 * other email; the code sits where the button would. Wording follows the
 * usual verification-email pattern: what it's for, the code, expiry, then
 * small-print security and "why you're getting this" lines.
 */
export function CodeEmail({ code }: { code: string }) {
  return (
    <EmailLayout preview={`${code} is your On Camera verification code`}>
      <EmailHeading align="center">Verify your email address</EmailHeading>
      <EmailText align="center">
        Use the verification code below to finish creating your On Camera
        account. This code expires in 10 minutes.
      </EmailText>
      <table role="presentation" align="center" cellPadding={0} cellSpacing={0} style={{ margin: "4px auto 24px" }}>
        <tr>
          <td
            {...{ bgcolor: "#1d1c22" }}
            style={{
              backgroundColor: "#1d1c22",
              borderRadius: 14,
              padding: "16px 28px",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: "'SF Mono', Menlo, Consolas, monospace",
                fontWeight: 700,
                fontSize: 34,
                letterSpacing: "0.32em",
                paddingLeft: "0.32em",
                color: "#edeae4",
              }}
            >
              {code}
            </Text>
          </td>
        </tr>
      </table>
      <EmailFinePrint align="center">
        If you didn&apos;t request this code, you can safely ignore this
        email. Someone may have entered your email address by mistake, and no
        account will be created without this code.
      </EmailFinePrint>
      <EmailFinePrint align="center">
        For your security, never share this code with anyone. On Camera will
        never ask you for it, by email, phone or message.
      </EmailFinePrint>
      <EmailFinePrint align="center">
        This is an automated message, so please don&apos;t reply to it.
      </EmailFinePrint>
    </EmailLayout>
  );
}
