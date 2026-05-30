-- Migration 020: Add experience column to player_heroes for proper XP accumulation
-- Heroes gain XP from battles and level up when enough XP is accumulated.
-- Formula: XP needed for level N = 500 * N (cumulative)
-- Level 1→2: 500 XP, Level 2→3: 1000 XP, Level 3→4: 1500 XP, etc.

ALTER TABLE player_heroes ADD COLUMN IF NOT EXISTS experience INTEGER NOT NULL DEFAULT 0;

-- Also update campaign_stages rewards to include heroXp
-- Stage 1-1 to 1-10 hero XP rewards (scaling)
UPDATE campaign_stages SET rewards = rewards || '{"heroXp": 200}'::jsonb WHERE id = '1-1';
UPDATE campaign_stages SET rewards = rewards || '{"heroXp": 250}'::jsonb WHERE id = '1-2';
UPDATE campaign_stages SET rewards = rewards || '{"heroXp": 300}'::jsonb WHERE id = '1-3';
UPDATE campaign_stages SET rewards = rewards || '{"heroXp": 350}'::jsonb WHERE id = '1-4';
UPDATE campaign_stages SET rewards = rewards || '{"heroXp": 400}'::jsonb WHERE id = '1-5';
UPDATE campaign_stages SET rewards = rewards || '{"heroXp": 450}'::jsonb WHERE id = '1-6';
UPDATE campaign_stages SET rewards = rewards || '{"heroXp": 500}'::jsonb WHERE id = '1-7';
UPDATE campaign_stages SET rewards = rewards || '{"heroXp": 600}'::jsonb WHERE id = '1-8';
UPDATE campaign_stages SET rewards = rewards || '{"heroXp": 700}'::jsonb WHERE id = '1-9';
UPDATE campaign_stages SET rewards = rewards || '{"heroXp": 800}'::jsonb WHERE id = '1-10';
