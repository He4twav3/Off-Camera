import { Text } from "@react-email/components";
import { EmailLayout, EmailHeading, EmailText } from "./components/email-layout";

/**
 * The sign-up verification code (see lib/email-code.ts). Same card as every
 * other email; the code sits where the button would.
 */
export function CodeEmail({ code }: { code: string }) {
  return (
    <EmailLayout preview={`${code} is your On Camera code`}>
      <EmailHeading align="center">Your code</EmailHeading>
      <EmailText align="center">
        Enter this code to confirm it&apos;s really you — no password needed.
      </EmailText>
      <table role="presentation" align="center" cellPadding={0} cellSpacing={0} style={{ margin: "4px auto 20px" }}>
        <tr>
          <td
            style={{
              backgroundColor: "#16151a",
              border: "1px solid #2d2b32",
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
      <EmailText align="center">This code expires in 10 minutes.</EmailText>
    </EmailLayout>
  );
}
