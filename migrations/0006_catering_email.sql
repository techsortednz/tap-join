-- Feedback and catering form emails can differ. forms_email = feedback form address; this is the catering one.
ALTER TABLE agreements ADD COLUMN catering_email TEXT;
