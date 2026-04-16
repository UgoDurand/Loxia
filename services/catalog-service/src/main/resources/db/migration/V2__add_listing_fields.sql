-- Add amenities, floor, energy class, and deposit to listings
ALTER TABLE listings
    ADD COLUMN amenities        TEXT    DEFAULT '',
    ADD COLUMN floor            INTEGER,
    ADD COLUMN energy_class     VARCHAR(1),
    ADD COLUMN deposit          INTEGER;
