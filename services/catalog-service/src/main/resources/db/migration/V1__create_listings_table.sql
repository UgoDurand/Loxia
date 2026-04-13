-- V1 : Create listings table
CREATE TABLE listings (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         VARCHAR(255)  NOT NULL,
    description   TEXT,
    property_type VARCHAR(50)   NOT NULL,
    city          VARCHAR(100)  NOT NULL,
    price         INTEGER       NOT NULL,
    surface       INTEGER       NOT NULL,
    rooms         INTEGER       NOT NULL,
    photo_urls    TEXT          DEFAULT '',
    owner_id      UUID          NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Indexes on frequently filtered / joined columns
CREATE INDEX idx_listings_owner_id ON listings (owner_id);
CREATE INDEX idx_listings_city ON listings (city);
CREATE INDEX idx_listings_property_type ON listings (property_type);
