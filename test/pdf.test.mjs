// Run with: node test/pdf.test.mjs   (writes test/out/sample-signed.pdf to look at)
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { stampAgreement } from "../src/pdf.js";

const root = new URL("../", import.meta.url);
const meta = JSON.parse(await readFile(new URL("assets/agreement.json", root), "utf8"));
const bytes = await stampAgreement({
  template: await readFile(new URL("assets/agreement-template.pdf", root)),
  meta,
  fonts: {
    regular: await readFile(new URL("assets/Outfit-Regular.ttf", root)),
    signature: await readFile(new URL("assets/Caveat-Medium.ttf", root)),
  },
  fields: {
    business_name: "Coffee Nation", legal_entity: "Coffee Nation Hamilton Limited", contact_person: "Paul Example",
    contact_role: "Owner", phone: "021 123 4567", accounts_email: "accounts@coffeenation.example",
    business_address: "123 Example Street, Hamilton Central, Hamilton 3204", forms_email: "hello@coffeenation.example",
    quote_number: "QU-0042", approved_emails: "paul@coffeenation.example, specials@coffeenation.example", sign_count: "6",
    customer_signatory: "Paul Example", customer_date: "28 October 2026",
    techsorted_signatory: "Shaun", techsorted_date: "28 October 2026",
  },
  customerSignature: "Paul Example",
  techsortedSignature: "Shaun",
  record: "Signed electronically by Paul Example (accounts@coffeenation.example) on 28 October 2026 at 7:12 pm NZDT from 203.0.113.7 · Ref TAP-20261028-7K2M · Agreement v1.0",
  id: "TAP-20261028-7K2M",
});
const doc = await PDFDocument.load(bytes);
assert.equal(doc.getPageCount(), 1);
assert.match(doc.getTitle(), /Coffee Nation/);
assert.ok(bytes.length < 400_000, `PDF too big: ${bytes.length}`);
await mkdir(new URL("test/out/", root), { recursive: true });
await writeFile(new URL("test/out/sample-signed.pdf", root), bytes);
console.log(`pdf ok (${Math.round(bytes.length / 1024)} KB)`);
