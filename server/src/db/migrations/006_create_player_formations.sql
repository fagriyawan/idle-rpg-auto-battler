CREATE TABLE player_formations (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    hero_ids UUID[] NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT formation_max_size CHECK (array_length(hero_ids, 1) IS NULL OR array_length(hero_ids, 1) <= 5)
);
