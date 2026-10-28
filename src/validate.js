// Field rules for the sign-up form and the admin invite form. Pure functions, tested in test/validate.test.mjs.

const EMAIL = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;
const SLUG = /^[a-z0-9]{2,30}$/;

// Fields the customer fills in. `locked` ones come from the invite and are shown read-only.
export const CUSTOMER_FIELDS = [
  { name: "business_name", label: "Business name", required: true, max: 120, locked: true },
  { name: "legal_entity", label: "Legal entity / NZBN", max: 120, hint: "e.g. Coffee Nation Ltd, or your NZBN" },
  { name: "contact_person", label: "Contact person", required: true, max: 80 },
  { name: "contact_role", label: "Role", max: 60, hint: "e.g. Owner" },
  { name: "phone", label: "Phone", required: true, max: 30, type: "tel", pattern: /^[0-9+()\s-]{6,30}$/ },
  { name: "accounts_email", label: "Accounts email", required: true, max: 120, type: "email", email: true, hint: "Invoices and your signed copy go here" },
  { name: "business_address", label: "Business address", required: true, max: 200 },
  { name: "forms_email", label: "Forms go to (email)", max: 120, type: "email", email: true, hint: "Where feedback and catering enquiries are sent" },
  { name: "page_slug", label: "Page address", max: 30, locked: true, prefix: "tap.techsorted.nz/" },
  { name: "quote_number", label: "Xero quote no.", max: 30, locked: true },
  { name: "sign_count", label: "Number of signs", max: 10, locked: true },
];

const clean = (v) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Customer submission. `invite` supplies the locked values (never trust the posted copies).
export function validateSignup(form, invite) {
  const values = {};
  const errors = {};
  for (const f of CUSTOMER_FIELDS) {
    let v = f.locked ? clean(invite[f.name]) : clean(form.get(f.name));
    if (f.max && v.length > f.max) v = v.slice(0, f.max);
    if (!f.locked) {
      if (f.required && !v) errors[f.name] = "Required";
      else if (v && f.email && !EMAIL.test(v)) errors[f.name] = "Check the email address";
      else if (v && f.pattern && !f.pattern.test(v)) errors[f.name] = "Check the number";
    }
    values[f.name] = v;
  }
  if (!values.forms_email) values.forms_email = values.accounts_email;

  const signedName = clean(form.get("signed_name")).slice(0, 80);
  if (signedName.length < 3 || !/\s/.test(signedName)) errors.signed_name = "Type your full name (first and last)";
  if (form.get("agree") !== "yes") errors.agree = "Tick to confirm you agree";
  if (form.get("authority") !== "yes") errors.authority = "Tick to confirm you can sign for the business";

  return { values, signedName, errors, ok: Object.keys(errors).length === 0 };
}

// Admin invite form.
export function validateInvite(form) {
  const v = {
    business_name: clean(form.get("business_name")).slice(0, 120),
    contact_name: clean(form.get("contact_name")).slice(0, 80),
    contact_email: clean(form.get("contact_email")).slice(0, 120),
    page_slug: clean(form.get("page_slug")).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30),
    quote_number: clean(form.get("quote_number")).slice(0, 30),
    sign_count: clean(form.get("sign_count")).slice(0, 10),
    note: clean(form.get("note")).slice(0, 300),
  };
  const errors = {};
  if (!v.business_name) errors.business_name = "Required";
  if (v.contact_email && !EMAIL.test(v.contact_email)) errors.contact_email = "Check the email address";
  if (v.page_slug && !SLUG.test(v.page_slug)) errors.page_slug = "2–30 lowercase letters or numbers";
  if (v.sign_count && !/^\d{1,4}$/.test(v.sign_count)) errors.sign_count = "A number";
  return { values: v, errors, ok: Object.keys(errors).length === 0 };
}

export function sameName(a, b) {
  const n = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
  return n(a) === n(b);
}

export function isEmail(s) {
  return EMAIL.test(s);
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
