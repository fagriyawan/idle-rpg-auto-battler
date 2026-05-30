-- Add positions column to player_formations table
-- positions format: [{"heroId": "uuid", "row": 0, "col": 0}, ...]
ALTER TABLE player_formations 
  ADD COLUMN IF NOT EXISTS positions JSONB NOT NULL DEFAULT '[]';
