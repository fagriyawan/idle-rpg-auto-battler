CREATE TABLE player_heroes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    hero_template_id VARCHAR(50) NOT NULL,
    name VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 100),
    stars INTEGER NOT NULL DEFAULT 1 CHECK (stars >= 1 AND stars <= 5),
    class_type VARCHAR(20) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{"attack": 0, "armor": 0, "hp": 0}',
    skills JSONB NOT NULL DEFAULT '[]',
    runes JSONB NOT NULL DEFAULT '[null, null, null, null]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_heroes_player ON player_heroes(player_id);
