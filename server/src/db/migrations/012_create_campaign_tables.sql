-- Campaign chapters (game data)
CREATE TABLE campaign_chapters (
    id VARCHAR(20) PRIMARY KEY,  -- e.g. 'chapter_1'
    chapter_number INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Campaign stages (game data)
CREATE TABLE campaign_stages (
    id VARCHAR(20) PRIMARY KEY,  -- e.g. '1-1', '1-2'
    chapter_id VARCHAR(20) NOT NULL REFERENCES campaign_chapters(id),
    stage_number INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    energy_cost INTEGER NOT NULL DEFAULT 10,
    enemies JSONB NOT NULL DEFAULT '[]',
    rewards JSONB NOT NULL DEFAULT '{}',
    recommended_level INTEGER NOT NULL DEFAULT 1,
    map_position_x FLOAT NOT NULL DEFAULT 0,
    map_position_y FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(chapter_id, stage_number)
);

CREATE INDEX idx_campaign_stages_chapter ON campaign_stages(chapter_id);

-- Player stage progress
CREATE TABLE player_stage_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    stage_id VARCHAR(20) NOT NULL REFERENCES campaign_stages(id),
    stars INTEGER NOT NULL DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
    clear_count INTEGER NOT NULL DEFAULT 0,
    first_cleared_at TIMESTAMP WITH TIME ZONE,
    last_cleared_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(player_id, stage_id)
);

CREATE INDEX idx_player_stage_progress_player ON player_stage_progress(player_id);
