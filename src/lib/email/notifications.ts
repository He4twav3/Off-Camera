import "server-only";
import { sendEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/request-url";
import { formatCurrency } from "@/lib/utils";
import { ApplicantApprovedEmail } from "@/emails/applicant-approved-email";
import { ApplicantRejectedEmail } from "@/emails/applicant-rejected-email";
import { AssignmentEmail } from "@/emails/assignment-email";
import { PayoutPaidEmail } from "@/emails/payout-paid-email";
import { ApplicationReceivedEmail } from "@/emails/application-received-email";
import { ApplicationAcceptedEmail } from "@/emails/application-accepted-email";
import { ApplicationDeclinedEmail } from "@/emails/application-declined-email";

// Applicant-facing emails, now real React Email components (see src/emails/)
// routed through the site's own mailer.ts — same branded shell every other
// transactional email on the site uses, and the same outbox-audit-log
// behavior. None of these ever reference gross_amount or any admin-only
// pricing field — only the flat figure quoted to the creator.

export async function sendApplicantApprovedEmail(to: string, name: string) {
  const baseUrl = await getBaseUrl();
  return sendEmail({
    to,
    subject: "You're approved — you're in the creator pool",
    react: ApplicantApprovedEmail({ name, dashboardUrl: `${baseUrl}/dashboard/recruiting` }),
    text: `You're approved, ${name}. You're now eligible to be matched with paid campaigns — check your dashboard: ${baseUrl}/dashboard/recruiting`,
  });
}

export async function sendApplicantRejectedEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: "Update on your Off Camera application",
    react: ApplicantRejectedEmail({ name }),
    text: `Thanks for applying, ${name}. Your profile isn't a fit for the campaigns we're running right now — reply to this email if you'd like us to take another look.`,
  });
}

export async function sendAssignmentEmail(
  to: string,
  name: string,
  jobTitle: string,
  payoutAmount: number,
) {
  const baseUrl = await getBaseUrl();
  const payoutLabel = formatCurrency(payoutAmount);
  return sendEmail({
    to,
    subject: `You've been assigned: ${jobTitle}`,
    react: AssignmentEmail({ name, jobTitle, payoutLabel, dashboardUrl: `${baseUrl}/dashboard/recruiting` }),
    text: `You're on a campaign, ${name}. You've been assigned to ${jobTitle} for ${payoutLabel}. Check your dashboard for the brief: ${baseUrl}/dashboard/recruiting`,
  });
}

export async function sendPayoutPaidEmail(
  to: string,
  name: string,
  jobTitle: string,
  payoutAmount: number,
) {
  const baseUrl = await getBaseUrl();
  const payoutLabel = formatCurrency(payoutAmount);
  return sendEmail({
    to,
    subject: `Payment sent — ${payoutLabel}`,
    react: PayoutPaidEmail({ name, jobTitle, payoutLabel, dashboardUrl: `${baseUrl}/dashboard/recruiting` }),
    text: `Your payment is on its way, ${name}. We've sent ${payoutLabel} for ${jobTitle}.`,
  });
}

// Sent to you, not the creator — a nudge that there's something in the queue.
// Falls back to no-op if ADMIN_NOTIFY_EMAIL isn't set.
export async function sendApplicationReceivedEmail(
  applicantName: string,
  jobTitle: string,
) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return { ok: true, skipped: true };

  const baseUrl = await getBaseUrl();
  return sendEmail({
    to,
    subject: `New application: ${jobTitle}`,
    react: ApplicationReceivedEmail({ applicantName, jobTitle, reviewUrl: `${baseUrl}/admin/applications` }),
    text: `${applicantName} applied for ${jobTitle}. Review it: ${baseUrl}/admin/applications`,
  });
}

export async function sendApplicationAcceptedEmail(
  to: string,
  name: string,
  jobTitle: string,
) {
  const baseUrl = await getBaseUrl();
  return sendEmail({
    to,
    subject: `You got it — ${jobTitle}`,
    react: ApplicationAcceptedEmail({ name, jobTitle, dashboardUrl: `${baseUrl}/dashboard/recruiting` }),
    text: `Good news, ${name} — we've accepted your application for ${jobTitle}. Check your dashboard: ${baseUrl}/dashboard/recruiting`,
  });
}

export async function sendApplicationDeclinedEmail(
  to: string,
  name: string,
  jobTitle: string,
) {
  const baseUrl = await getBaseUrl();
  return sendEmail({
    to,
    subject: `Update on your application — ${jobTitle}`,
    react: ApplicationDeclinedEmail({ name, jobTitle, jobsUrl: `${baseUrl}/dashboard/recruiting/jobs` }),
    text: `Thanks for applying, ${name}. We went with someone else for ${jobTitle} — see what else is open: ${baseUrl}/dashboard/recruiting/jobs`,
  });
}
