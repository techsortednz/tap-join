// Run with: node test/validate.test.mjs
import assert from "node:assert/strict";
import { validateSignup, validateInvite, escapeHtml } from "../src/validate.js";

const invite = { business_name: "Coffee Nation", page_slug: "coffeenation", quote_number: "QU-1", sign_count: "6" };
const fd = (o) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.append(k, v); return f; };
const good = {
  contact_person: "Paul Example", phone: "021 123 4567", accounts_email: "a@b.co", business_address: "1 Street, Hamilton",
  agree: "yes", authority: "yes", signed_name: "Paul Example", approved_email_1: "A@b.co", approved_email_2: "a@b.co", approved_email_3: "c@d.co",
};

let r = validateSignup(fd(good), invite);
assert.ok(r.ok, JSON.stringify(r.errors));
assert.equal(r.values.forms_email, "a@b.co", "forms email falls back to accounts email");
assert.equal(r.values.promo_consent, 0, "promo only when ticked");
assert.equal(validateSignup(fd({ ...good, promo: "yes" }), invite).values.promo_consent, 1);
assert.equal(r.values.approved_emails, "a@b.co, c@d.co", "approved emails are lower-cased and de-duplicated");

r = validateSignup(fd({ ...good, business_name: "Hacked", sign_count: "999" }), invite);
assert.equal(r.values.business_name, "Coffee Nation", "locked fields come from the invite");
assert.equal(r.values.sign_count, "6");

for (const [k, v] of [["agree", ""], ["authority", ""], ["signed_name", "Paul"], ["accounts_email", "nope"], ["phone", "call me"], ["approved_email_1", ""], ["approved_email_2", "nope"]]) {
  r = validateSignup(fd({ ...good, [k]: v }), invite);
  assert.ok(r.errors[k], `expected error for ${k}`);
}

r = validateInvite(fd({ business_name: "X", page_slug: "Coffee-Nation!", sign_count: "6" }));
assert.ok(r.ok); assert.equal(r.values.page_slug, "coffeenation");
assert.ok(!validateInvite(fd({ business_name: "" })).ok);
assert.equal(escapeHtml(`<a href="x">'`), "&lt;a href=&quot;x&quot;&gt;&#39;");
console.log("validate ok");
