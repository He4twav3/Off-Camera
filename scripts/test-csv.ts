/** Tests the CSV helper (src/lib/csv.ts). Run:  npx tsx scripts/test-csv.ts */
import { csvCell, toCsv } from "../src/lib/csv";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
t("plain text stays plain", csvCell("Maria") === "Maria");
t("a comma is quoted", csvCell("Lopez, Maria") === '"Lopez, Maria"');
t("a quote is doubled", csvCell('He said "hi"') === '"He said ""hi"""');
t("a formula is defused", csvCell("=HYPERLINK(\"x\")").startsWith("\"'=") || csvCell("=SUM(A1)") === "'=SUM(A1)");
t("a leading plus is defused", csvCell("+48 123") === "'+48 123");
t("a negative number is not touched", csvCell(-5) === "-5");
t("empty cells are empty", csvCell(null) === "" && csvCell(undefined) === "");
t("rows join with line breaks", toCsv([["a", 1], ["b", 2]]) === "a,1\r\nb,2\r\n");
console.log(bad ? `${bad} failed` : "all passed");
process.exit(bad ? 1 : 0);
