CREATE TABLE player_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL DEFAULT 'rune',
    item_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_inventory_player ON player_inventory(player_id);
CREATE INDEX idx_player_inventory_type ON player_inventory(player_id, item_type);
