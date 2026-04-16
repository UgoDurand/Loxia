-- =====================================================================
-- Loxia — chat-service — initial schema
-- =====================================================================

CREATE TABLE conversations (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id    UUID        NOT NULL,
    listing_title TEXT        NOT NULL,
    tenant_id     UUID        NOT NULL,
    tenant_name   TEXT        NOT NULL,
    owner_id      UUID        NOT NULL,
    owner_name    TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation UNIQUE (listing_id, tenant_id)
);

CREATE INDEX idx_conv_tenant_id ON conversations(tenant_id);
CREATE INDEX idx_conv_owner_id  ON conversations(owner_id);

CREATE TABLE messages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID        NOT NULL,
    sender_name     TEXT        NOT NULL,
    content         TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_msg_conversation_id ON messages(conversation_id);
CREATE INDEX idx_msg_created_at      ON messages(created_at);
