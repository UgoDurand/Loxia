CREATE TABLE notifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID          NOT NULL,
    type                    VARCHAR(50)   NOT NULL,
    title                   VARCHAR(255)  NOT NULL,
    message                 TEXT          NOT NULL,
    related_listing_id      UUID,
    related_application_id  UUID,
    read                    BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_user_read ON notifications (user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);
