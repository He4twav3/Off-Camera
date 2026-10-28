/** Tests the creator bank details and the Wise payment file (src/lib/bank-details.ts, src/lib/wise-batch.ts). Run:  npx tsx scripts/test-bank-details.ts */
import { abaValid, bankSummary, containsCardNumber, ibanValid, isCardNumber, parseBankDetails } from "../src/lib/bank-details";
import { buildBatchCsv, mergeByCreator, parseCsv, readTemplate } from "../src/lib/wise-batch";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

const base = { holderName: "Maria Lopez", country: "DE", city: "Berlin", address: "Hauptstr 1", postCode: "10115" };

// IBANs, routing numbers, cards
t("a real IBAN passes", ibanValid("DE89 3704 0044 0532 0130 00"));
t("a mistyped IBAN fails", !ibanValid("DE89 3704 0044 0532 0130 01"));
t("a real ABA routing number passes", abaValid("026009593"));
t("a mistyped routing number fails", !abaValid("026009594"));
t("a Visa test card is a card", isCardNumber("4242 4242 4242 4242"));
t("an IBAN is never a card", !isCardNumber("DE89370400440532013000"));
t("a card inside an address is caught", containsCardNumber("Street 4242-4242-4242-4242"));

// the form
const eur = parseBankDetails({ ...base, currency: "EUR", iban: "de89 3704 0044 0532 0130 00" });
t("EUR with an IBAN saves, cleaned up", eur.ok && eur.value.bank.iban === "DE89370400440532013000", eur);
t("the summary shows only the last 4", eur.ok && bankSummary(eur.value) === "Bank account in EUR · IBAN ending 3000", eur.ok && bankSummary(eur.value));
const card = parseBankDetails({ ...base, currency: "GBP", sortCode: "40-30-20", accountNumber: "4242424242424242" });
t("a card number as the account number is refused", !card.ok && /card number/.test(card.error), card);
const cardIban = parseBankDetails({ ...base, currency: "EUR", iban: "4242 4242 4242 4242" });
t("a card number in the IBAN box is refused as a card", !cardIban.ok && /card number/.test(cardIban.error), cardIban);
t("GBP needs an 8-digit account number", !parseBankDetails({ ...base, currency: "GBP", sortCode: "403020", accountNumber: "1234567" }).ok);
t("GBP with sort code and account saves", parseBankDetails({ ...base, country: "GB", currency: "GBP", sortCode: "40-30-20", accountNumber: "12345678" }).ok);
const usdAbroad = parseBankDetails({ ...base, currency: "USD", abartn: "026009593", accountNumber: "12345678", accountType: "CHECKING" });
t("USD only to US accounts", !usdAbroad.ok && /US bank accounts only/.test(usdAbroad.error), usdAbroad);
const usNoState = parseBankDetails({ ...base, country: "US", currency: "USD", abartn: "026009593", accountNumber: "12345678", accountType: "CHECKING" });
t("a US address needs a state", !usNoState.ok && /state/.test(usNoState.error), usNoState);
const us = parseBankDetails({ ...base, country: "US", state: "NY", currency: "USD", abartn: "026009593", accountNumber: "12345678", accountType: "checking" });
t("a US account saves", us.ok && us.value.bank.accountType === "CHECKING", us);
t("a PLN account needs a Polish IBAN", !parseBankDetails({ ...base, currency: "PLN", iban: "DE89370400440532013000" }).ok);
t("a single name is not enough", !parseBankDetails({ ...base, holderName: "Maria", currency: "EUR", iban: "DE89370400440532013000" }).ok);
t("an unknown currency is refused", !parseBankDetails({ ...base, currency: "XYZ" }).ok);

// the Wise file
if (eur.ok && us.ok) {
  const rows = mergeByCreator([
    { applicantId: "a", amount: 100, reference: "OnCamera payout", details: { ...eur.value, email: "m@x.com" } },
    { applicantId: "a", amount: 25.5, reference: "OnCamera payout", details: { ...eur.value, email: "m@x.com" } },
    { applicantId: "b", amount: 40, reference: "OnCamera payout", details: { ...us.value, email: "j@x.com" } },
  ]);
  t("one row per creator, amounts added", rows.length === 2 && rows[0].amount === 125.5, rows.map((r) => r.amount));

  const csv = parseCsv(buildBatchCsv(rows));
  const col = (name: string) => csv[0].indexOf(name);
  t("default file: name, amount, currencies", csv[1][col("name")] === "Maria Lopez" && csv[1][col("amount")] === "125.50" && csv[1][col("sourceCurrency")] === "USD" && csv[1][col("targetCurrency")] === "EUR", csv[1]);
  t("IBAN in the EUR row, routing in the USD row", csv[1][col("IBAN")] === "DE89370400440532013000" && csv[2][col("abartn")] === "026009593" && csv[2][col("IBAN")] === "", csv);

  const tpl = readTemplate('﻿name,recipientEmail,"amountCurrency",amount,sourceCurrency,targetCurrency,IBAN,Some New Column\r\ne.g. Jane Doe,jane@x.com,source,100,USD,EUR,DE00,x\r\n');
  t("a Wise template is read, unknown columns listed", tpl.ok && tpl.header.length === 8 && tpl.unknown.join() === "Some New Column", tpl);
  if (tpl.ok) {
    const filled = parseCsv(buildBatchCsv(rows, tpl.header));
    t("the template's own headers are kept unchanged", filled[0].join() === tpl.header.join(), filled[0]);
    t("example rows are never copied", filled.length === 3 && !filled.some((r) => r[0].startsWith("e.g.")), filled);
    t("unknown columns stay blank", filled[1][7] === "", filled[1]);
  }
  t("a random CSV is not a template", !readTemplate("a,b,c\n1,2,3").ok);
}

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
