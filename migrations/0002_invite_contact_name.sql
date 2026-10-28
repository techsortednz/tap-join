-- The customer's name on the invite, so the sign-up email can say "Hi Paul" and the form is pre-filled.
ALTER TABLE invites ADD COLUMN contact_name TEXT;
