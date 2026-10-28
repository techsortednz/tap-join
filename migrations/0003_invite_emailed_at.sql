-- When the sign-up link was last emailed to the customer (shown on the Agreements page).
ALTER TABLE invites ADD COLUMN emailed_at TEXT;
