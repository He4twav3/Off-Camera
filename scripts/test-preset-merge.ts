/**
 * The setup never undoes a hand edit. Run: npx tsx --conditions=react-server scripts/test-preset-merge.ts
 */
import { fingerprint, planParts } from "../src/lib/apply-campaign-presets";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

// First setup: everything is written.
{
  const { write } = planParts({ description: { live: "old", next: "new" }, examples: { live: ["a"], next: ["b"] } }, {}, true);
  t("first setup writes every part", write.has("description") && write.has("examples"), [...write]);
}
// A later version: an untouched part is updated, a hand-edited part is kept.
{
  const stored = { description: fingerprint("v1 brief"), examples: fingerprint(["a", "b"]) };
  const { write, fingerprints } = planParts(
    { description: { live: "v1 brief", next: "v2 brief" }, examples: { live: ["a", "c"], next: ["a", "b", "d"] } },
    stored,
    false,
  );
  t("untouched part gets the new version", write.has("description"), [...write]);
  t("hand-edited videos are kept", !write.has("examples"), [...write]);
  t("hand-edited part keeps its old fingerprint", fingerprints.examples === stored.examples);
  // And it stays protected on the version after that.
  const again = planParts({ examples: { live: ["a", "c"], next: ["x"] } }, fingerprints, false);
  t("still kept a version later", !again.write.has("examples"));
}
// A campaign set up before fingerprints existed (MePersona now): nothing that differs is written.
{
  const { write, fingerprints } = planParts(
    { description: { live: "edited by hand", next: "setup brief" }, guide: { live: "same", next: "same" } },
    {},
    false,
  );
  t("no fingerprints yet: hand edits are kept", write.size === 0, [...write]);
  t("no fingerprints yet: matching parts are recorded", fingerprints.guide === fingerprint("same") && !fingerprints.description);
}
t("fingerprint ignores key order and spaces", fingerprint({ a: 1, b: " x " }) === fingerprint({ b: "x", a: 1 }));

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
