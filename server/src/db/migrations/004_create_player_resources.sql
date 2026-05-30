CREATE TABLE player_resources (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    gold INTEGER NOT NULL DEFAULT 500 CHECK (gold >= 0 AND gold <= 999999),
    gems INTEGER NOT NULL DEFAULT 50 CHECK (gems >= 0 AND gems <= 99999),
    energy INTEGER NOT NULL DEFAULT 100 CHECK (energy >= 0 AND energy <= 200),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
