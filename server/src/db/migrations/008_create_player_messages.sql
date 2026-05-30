CREATE TABLE player_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL DEFAULT 'System',
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    reward_type VARCHAR(20),
    reward_amount INTEGER DEFAULT 0,
    claimed BOOLEAN NOT NULL DEFAULT FALSE,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_messages_player ON player_messages(player_id);
CREATE INDEX idx_player_messages_unread ON player_messages(player_id, read) WHERE read = FALSE;
