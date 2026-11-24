import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Body, Figures, Head, SectionTitle, Table, Td, Th } from "@/components/admin/table";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/app/CopyLinkButton";
import { CREDIT_PROGRAMS, waiting } from "@/lib/tool-credits";
import { readRequests } from "@/lib/tool-credits-store";
import { formatDate } from "@/lib/utils";
import { markSentAction, unmarkSentAction } from "./actions";

export const metadata: Metadata = { title: "Credits · Admin" };

/**
 * Free tool credits the brand tops up by hand. Creators on the campaign enter their account email on the campaign
 * page; here you copy or download the ones waiting, send them to the brand, then mark them sent.
 */
export default async function AdminCreditsPage() {
  const programs = await Promise.all(CREDIT_PROGRAMS.map(async (program) => ({ program, list: await readRequests(program.key) })));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-5 py-10">
      <header>
        <h1 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Credits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Creators on the campaign give their account email. Send the waiting ones to the brand, then mark them sent.
        </p>
      </header>

      {programs.map(({ program, list }) => {
        const toSend = waiting(list);
        const sent = list.filter((r) => r.sentAt).sort((a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? ""));
        return (
          <section key={program.key} className="flex flex-col gap-4">
            <SectionTitle
              aside={
                list.length > 0 ? (
                  <Button size="sm" variant="outline" nativeButton={false} render={<a href={`/admin/credits/${program.key}/list?all=1`} />}>
                    <Download className="size-4" />
                    Everyone (CSV)
                  </Button>
                ) : null
              }
            >
              {program.brand}
            </SectionTitle>
            <Figures
              items={[
                { label: "Waiting to send", value: String(toSend.length), attention: toSend.length > 0 },
                { label: "Sent to the brand", value: String(sent.length) },
              ]}
            />

            <h3 className="font-heading text-base font-semibold text-foreground">Waiting</h3>
            {toSend.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody waiting. New ones show up here as creators add their email.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <CopyLinkButton url={toSend.map((r) => r.toolEmail).join("\n")} label={`Copy ${toSend.length} ${toSend.length === 1 ? "email" : "emails"}`} />
                  <Button size="sm" variant="outline" nativeButton={false} render={<a href={`/admin/credits/${program.key}/list`} />}>
                    <Download className="size-4" />
                    Download list (CSV)
                  </Button>
                  <form action={markSentAction}>
                    <input type="hidden" name="program" value={program.key} />
                    {toSend.map((r) => (
                      <input key={r.applicantId} type="hidden" name="id" value={r.applicantId} />
                    ))}
                    <Button type="submit" size="sm">
                      Mark these {toSend.length} as sent
                    </Button>
                  </form>
                </div>
                <p className="max-w-2xl text-xs text-muted-foreground">
                  &ldquo;Mark as sent&rdquo; only marks the people listed on this page. Anyone who adds an email after you opened it stays
                  waiting for the next list.
                </p>
                <Table min="40rem">
                  <Head>
                    <Th>{program.brand} account email</Th>
                    <Th>Creator</Th>
                    <Th>Added</Th>
                  </Head>
                  <Body>
                    {toSend.map((r) => (
                      <tr key={r.applicantId}>
                        <Td className="font-mono">{r.toolEmail}</Td>
                        <Td>
                          {r.name}
                          <span className="block text-xs text-muted-foreground">{r.email}</span>
                        </Td>
                        <Td muted>{formatDate(r.submittedAt)}</Td>
                      </tr>
                    ))}
                  </Body>
                </Table>
              </>
            )}

            {sent.length > 0 && (
              <>
                <h3 className="font-heading text-base font-semibold text-foreground">Sent</h3>
                <Table min="44rem">
                  <Head>
                    <Th>{program.brand} account email</Th>
                    <Th>Creator</Th>
                    <Th>Sent</Th>
                    <Th />
                  </Head>
                  <Body>
                    {sent.map((r) => (
                      <tr key={r.applicantId}>
                        <Td className="font-mono">{r.toolEmail}</Td>
                        <Td>
                          {r.name}
                          <span className="block text-xs text-muted-foreground">{r.email}</span>
                        </Td>
                        <Td muted>{r.sentAt ? formatDate(r.sentAt) : "—"}</Td>
                        <Td right>
                          <form action={unmarkSentAction}>
                            <input type="hidden" name="program" value={program.key} />
                            <input type="hidden" name="id" value={r.applicantId} />
                            <Button type="submit" size="sm" variant="ghost">
                              Not sent
                            </Button>
                          </form>
                        </Td>
                      </tr>
                    ))}
                  </Body>
                </Table>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
