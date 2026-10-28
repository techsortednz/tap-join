-- Invites: one private sign-up link per new customer, made from the admin page.
CREATE TABLE invites (
  code          TEXT PRIMARY KEY,          -- random, goes in the link /j/<code>
  created_at    TEXT NOT NULL,             -- ISO UTC
  expires_at    TEXT NOT NULL,             -- ISO UTC
  business_name TEXT NOT NULL,
  contact_email TEXT,
  page_slug     TEXT,
  quote_number  TEXT,
  sign_count    TEXT,
  note          TEXT,                      -- private, admin only
  revoked_at    TEXT,
  signed_at     TEXT,
  agreement_id  TEXT
);

-- Agreements: one row per signed agreement. The signed PDF lives in R2 at pdf_key.
CREATE TABLE agreements (
  id               TEXT PRIMARY KEY,       -- e.g. TAP-20261028-7K2M
  invite_code      TEXT NOT NULL REFERENCES invites(code),
  terms_version    TEXT NOT NULL,
  business_name    TEXT NOT NULL,
  legal_entity     TEXT,
  contact_person   TEXT NOT NULL,
  contact_role     TEXT,
  phone            TEXT NOT NULL,
  accounts_email   TEXT NOT NULL,
  business_address TEXT NOT NULL,
  forms_email      TEXT,
  page_slug        TEXT,
  quote_number     TEXT,
  sign_count       TEXT,
  signed_name      TEXT NOT NULL,          -- typed full name (the signature)
  signed_at        TEXT NOT NULL,          -- ISO UTC
  ip               TEXT,
  country          TEXT,
  user_agent       TEXT,
  countersigned_by TEXT NOT NULL,
  pdf_key          TEXT NOT NULL,
  pdf_sha256       TEXT NOT NULL,
  email_sent       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX agreements_signed_at ON agreements(signed_at);
