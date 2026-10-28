-- Whether the customer is happy for photos of their Tap Signs (with their business name) to be used
-- in tap by techsorted promotion. 1 = yes, 0 = no. Can be changed on the hub if they opt out later.
ALTER TABLE agreements ADD COLUMN promo_consent INTEGER NOT NULL DEFAULT 0;
