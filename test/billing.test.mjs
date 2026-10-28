// Run with: node test/billing.test.mjs
import assert from "node:assert/strict";
import { billingPlan } from "../src/billing.js";

// Live 15 Nov: free to 14 Dec; 10 Dec invoice = 15–31 Dec (17/31) + January.
let p = billingPlan("2026-11-15", 39.99);
assert.equal(p.freeUntil, "2026-12-14");
assert.equal(p.firstInvoice.date, "2026-12-10");
assert.equal(p.firstInvoice.due, "2026-12-20");
assert.deepEqual(p.firstInvoice.lines.map((l) => l.amount), [21.93, 39.99]);
assert.equal(p.firstInvoice.total, 61.92);
assert.equal(p.repeating.from, "2027-01-10");
assert.equal(p.repeating.forMonth, "February 2027");

// Live 2 Nov: free to 1 Dec; 10 Nov invoice = 2–31 Dec (30/31).
p = billingPlan("2026-11-02", 39.99);
assert.equal(p.freeUntil, "2026-12-01");
assert.equal(p.firstInvoice.date, "2026-11-10");
assert.deepEqual(p.firstInvoice.lines.map((l) => l.amount), [38.7]);
assert.equal(p.repeating.from, "2026-12-10");

// Live 10 Nov (the 10th itself): first invoice is the next 10th.
p = billingPlan("2026-11-10", 39.99);
assert.equal(p.firstInvoice.date, "2026-12-10");
assert.match(p.firstInvoice.lines[0].description, /10 Dec to 31 Dec 2026/);

// Live 1 Feb (non-leap): free to 2 Mar; 10 Feb invoice covers March from the 3rd.
p = billingPlan("2027-02-01", 39.99);
assert.equal(p.freeUntil, "2027-03-02");
assert.equal(p.firstInvoice.date, "2027-02-10");
assert.equal(p.firstInvoice.lines.length, 1);
assert.match(p.firstInvoice.lines[0].description, /3 Mar to 31 Mar 2027 \(29 of 31 days/);

// Live 20 Dec: free to 18 Jan; 10 Jan invoice = 19–31 Jan + February; year rollover.
p = billingPlan("2026-12-20", 39.99);
assert.equal(p.freeUntil, "2027-01-18");
assert.equal(p.firstInvoice.date, "2027-01-10");
assert.equal(p.firstInvoice.lines.length, 2);
assert.equal(p.repeating.from, "2027-02-10");
console.log("billing ok");
