-- V3 : Add geocoordinates to listings
ALTER TABLE listings
    ADD COLUMN latitude  DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION;
