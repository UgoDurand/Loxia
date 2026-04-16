-- Add desired rental start/end dates to applications
ALTER TABLE applications
    ADD COLUMN start_date DATE,
    ADD COLUMN end_date   DATE;
