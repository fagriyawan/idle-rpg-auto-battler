ALTER TABLE players
  ADD COLUMN display_name VARCHAR(20),
  ADD COLUMN level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN experience BIGINT NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX idx_players_display_name ON players(display_name) WHERE display_name IS NOT NULL;
