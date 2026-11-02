import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Body, Figures, Head, SectionTitle, Table, Td, Th } from "@/components/admin/table";
import { Button } from "@/components/ui/button";
import { AFFILIATE_PROGRAMS } from "@/lib/affiliate-programs";
import { readCodes, resultsFor } from "@/lib/affiliate-codes";
import { formatDate } from "@/lib/utils";
import { UploadForm } from "./UploadForm";
import { retireCodeAction } from "./actions";

export const metadata: Metadata = { title: "Affiliates · Admin" };

/**
 * Each brand's partner codes: upload the brand's list once, see which creator has which code (creators on the
 * campaign are given one automatically in their Affiliates page), retire a code that was lost or shared, and download
 * the report the brand asked for, listed by code number.
 */
export default async function AdminAffiliatesPage() {
  const programs = await Promise.all(
    AFFILIATE_PROGRAMS.map(async (program) => {
      const codes = await readCodes(program.key);
      const results = await resultsFor(program, [...new Set(codes.flatMap((c) => (c.applicantId ? [c.applicantId] : [])))]);
      return { program, codes, results };
    }),
  );

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Affiliates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brands&apos; partner codes. Creators on the campaign get the next free code in their Affiliates page.
        </p>
      </header>

      {programs.map(({ program, codes, results }) => {
        const given = codes.filter((c) => c.status === "given");
        const unused = codes.filter((c) => c.status === "unused");
        const shown = codes.filter((c) => c.status !== "unused");
        return (
          <section key={program.key} className="flex flex-col gap-4">
            <SectionTitle
              aside={
                codes.length > 0 ? (
                  <Button size="sm" variant="outline" nativeButton={false} render={<a href={`/admin/affiliates/${program.key}/report`} />}>
                    <Download className="size-4" />
                    Download report for {program.brand}
                  </Button>
                ) : null
              }
            >
              {program.brand}
            </SectionTitle>
            {codes.length > 0 && (
              <Figures
                items={[
                  { label: "Given to creators", value: String(given.length) },
                  { label: "Still free", value: String(unused.length), attention: unused.length < 5 },
                  { label: "Codes in total", value: String(codes.length), hint: `Work until ${program.expires}` },
                ]}
              />
            )}
            <div className="max-w-md">
              <UploadForm program={program.key} hasCodes={codes.length > 0} />
            </div>
            {shown.length > 0 ? (
              <Table min="52rem">
                <Head>
                  <Th>#</Th>
                  <Th>Code</Th>
                  <Th>Creator</Th>
                  <Th>Their link</Th>
                  <Th>Given</Th>
                  <Th right>Videos</Th>
                  <Th right>Views</Th>
                  <Th />
                </Head>
                <Body>
                  {shown.map((c) => {
                    const r = c.applicantId ? results.get(c.applicantId) : undefined;
                    return (
                      <tr key={c.code}>
                        <Td>{c.number}</Td>
                        <Td className="font-mono">
                          {c.code}
                          {c.status === "retired" && <span className="ml-2 font-sans text-xs text-muted-foreground">retired</span>}
                        </Td>
                        <Td>
                          {c.name ?? "—"}
                          {c.email && <span className="block text-xs text-muted-foreground">{c.email}</span>}
                        </Td>
                        <Td muted>
                          {c.link ? (
                            <a href={c.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                              {c.link.replace(/^https:\/\//, "")}
                            </a>
                          ) : (
                            "Not added yet"
                          )}
                        </Td>
                        <Td muted>{c.givenAt ? formatDate(c.givenAt) : "—"}</Td>
                        <Td right>{r?.posts ?? 0}</Td>
                        <Td right>{(r?.views ?? 0).toLocaleString("en-US")}</Td>
                        <Td right>
                          {c.status === "given" && (
                            <form action={retireCodeAction}>
                              <input type="hidden" name="program" value={program.key} />
                              <input type="hidden" name="code" value={c.code} />
                              <Button type="submit" size="sm" variant="ghost">
                                Retire
                              </Button>
                            </form>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </Body>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                {codes.length > 0 ? "No code given out yet." : `Upload the code list ${program.brand} sent to start giving codes out.`}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
