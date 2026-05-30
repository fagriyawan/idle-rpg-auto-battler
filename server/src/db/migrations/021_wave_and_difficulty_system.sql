-- Migration 021: Wave system + Difficulty modes (Easy/Hard/Nightmare)
-- Each stage now has 3 waves of enemies per difficulty mode.
-- Player HP persists across waves (no reset between waves).

-- New table: stage_waves — stores enemy data per wave per difficulty
CREATE TABLE IF NOT EXISTS stage_waves (
    id SERIAL PRIMARY KEY,
    stage_id VARCHAR(20) NOT NULL REFERENCES campaign_stages(id) ON DELETE CASCADE,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'easy', -- easy, hard, nightmare
    wave_number INTEGER NOT NULL CHECK (wave_number >= 1 AND wave_number <= 3),
    enemies JSONB NOT NULL DEFAULT '[]',
    UNIQUE(stage_id, difficulty, wave_number)
);

CREATE INDEX idx_stage_waves_lookup ON stage_waves(stage_id, difficulty);

-- New table: stage_difficulty_rewards — rewards per stage per difficulty
CREATE TABLE IF NOT EXISTS stage_difficulty_rewards (
    id SERIAL PRIMARY KEY,
    stage_id VARCHAR(20) NOT NULL REFERENCES campaign_stages(id) ON DELETE CASCADE,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'easy',
    gold INTEGER NOT NULL DEFAULT 0,
    gems INTEGER NOT NULL DEFAULT 0,
    player_xp INTEGER NOT NULL DEFAULT 0,
    hero_xp INTEGER NOT NULL DEFAULT 0,
    UNIQUE(stage_id, difficulty)
);

-- New table: player_difficulty_progress — track per-mode progress
CREATE TABLE IF NOT EXISTS player_difficulty_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    stage_id VARCHAR(20) NOT NULL REFERENCES campaign_stages(id),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'easy',
    stars INTEGER NOT NULL DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
    clear_count INTEGER NOT NULL DEFAULT 0,
    first_cleared_at TIMESTAMP WITH TIME ZONE,
    last_cleared_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(player_id, stage_id, difficulty)
);

CREATE INDEX idx_player_diff_progress ON player_difficulty_progress(player_id, difficulty);
