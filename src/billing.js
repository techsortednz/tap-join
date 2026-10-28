// Works out the free period and the first invoice for a customer, from their go-live date.
//
// The rules (agreement v1.4):
//   - the first 30 days after go-live are free (go-live day is day 1)
//   - invoices go out around the 10th of each month, in advance, for the following month, due by the 20th
//   - the first invoice is the first 10th after go-live; it charges a daily rate only for days after
//     the free 30 days, up to the end of the month that invoice is for
//   - after that, the normal repeating invoice starts on the next 10th
// All dates are plain calendar dates ("YYYY-MM-DD"), no time zones involved.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const parse = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d }; // m is 1-12
};
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const toUtc = ({ y, m, d }) => Date.UTC(y, m - 1, d);
const fromUtc = (t) => {
  const x = new Date(t);
  return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() };
};
const addDays = (date, n) => fromUtc(toUtc(date) + n * 86400000);
const addMonths = ({ y, m }, n) => {
  const i = y * 12 + (m - 1) + n;
  return { y: Math.floor(i / 12), m: (i % 12) + 1 };
};
const iso = ({ y, m, d }) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
export const nice = ({ y, m, d }) => `${d} ${MONTHS[m - 1]} ${y}`;
const monthName = ({ y, m }) => `${MONTHS[m - 1]} ${y}`;
const short = ({ d, m }) => `${d} ${MONTHS[m - 1].slice(0, 3)}`;

/**
 * @param {string} goLive "YYYY-MM-DD"
 * @param {number} monthly monthly price ex GST, e.g. 39.99
 */
export function billingPlan(goLive, monthly) {
  const g = parse(goLive);
  const freeUntil = addDays(g, 29);
  const billFrom = addDays(g, 30);

  // First 10th strictly after go-live.
  let inv = { y: g.y, m: g.m, d: 10 };
  if (g.d >= 10) inv = { ...addMonths(g, 1), d: 10 };
  const coversMonth = addMonths(inv, 1); // the month this invoice is "for"
  const periodEnd = { ...coversMonth, d: daysIn(coversMonth.y, coversMonth.m) };

  // Split billFrom..periodEnd into calendar-month pieces.
  const lines = [];
  let cur = billFrom;
  while (toUtc(cur) <= toUtc(periodEnd)) {
    const end = { y: cur.y, m: cur.m, d: daysIn(cur.y, cur.m) };
    const last = toUtc(end) <= toUtc(periodEnd) ? end : periodEnd;
    const days = last.d - cur.d + 1;
    const dim = daysIn(cur.y, cur.m);
    const full = cur.d === 1 && days === dim;
    const amount = full ? monthly : Math.round(((monthly * days) / dim) * 100) / 100;
    lines.push({
      description: full
        ? `Tap Sign subscription – ${monthName(cur)}`
        : `Tap Sign subscription – ${short(cur)} to ${short(last)} ${cur.y} (${days} of ${dim} days, pro rata)`,
      amount,
    });
    cur = addDays(last, 1);
  }
  const total = Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  const repeatFrom = { ...addMonths(inv, 1), d: 10 };

  return {
    goLive: iso(g),
    freeUntil: iso(freeUntil),
    firstInvoice: { date: iso(inv), due: iso({ ...inv, d: 20 }), lines, total },
    repeating: { from: iso(repeatFrom), forMonth: monthName(addMonths(repeatFrom, 1)), amount: monthly },
    text: {
      freeUntil: nice(freeUntil),
      invoiceDate: nice(inv),
      due: nice({ ...inv, d: 20 }),
      repeatFrom: nice(repeatFrom),
    },
  };
}
