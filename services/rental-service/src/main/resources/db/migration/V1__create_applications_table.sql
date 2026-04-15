-- V1 : Create applications table
CREATE TABLE applications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id        UUID          NOT NULL,
    applicant_id      UUID          NOT NULL,
    monthly_income    INTEGER       NOT NULL,
    employment_status VARCHAR(50)   NOT NULL,
    message           TEXT,
    status            VARCHAR(20)   NOT NULL,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_listing_id ON applications (listing_id);
CREATE INDEX idx_applications_applicant_id ON applications (applicant_id);
CREATE INDEX idx_applications_status ON applications (status);
