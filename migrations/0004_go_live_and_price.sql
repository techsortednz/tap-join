-- Planned go-live date and monthly price (ex GST), set by Shaun on the link and carried onto the
-- signed agreement, where the go-live date can be changed later. Used for the first-invoice calculator.
ALTER TABLE invites ADD COLUMN go_live TEXT;
ALTER TABLE invites ADD COLUMN monthly_price TEXT;
ALTER TABLE agreements ADD COLUMN go_live TEXT;
ALTER TABLE agreements ADD COLUMN monthly_price TEXT;
-- Email addresses the customer approved to send updates (specials, menu changes), comma-separated.
ALTER TABLE agreements ADD COLUMN approved_emails TEXT;
