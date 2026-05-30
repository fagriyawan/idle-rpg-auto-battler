INSERT INTO campaign_chapters (id, chapter_number, title, description)
VALUES ('chapter_1', 1, 'The Awakening Journey', 'Begin your adventure in the mystical lands. Face goblins, wolves, and dark creatures as you grow stronger.');

INSERT INTO campaign_stages (id, chapter_id, stage_number, title, energy_cost, enemies, rewards, recommended_level, map_position_x, map_position_y)
VALUES
  ('1-1', 'chapter_1', 1, 'Forest Entrance', 10,
   '[{"name": "Forest Goblin", "level": 1, "hp": 200, "attack": 30, "icon": "👺"}, {"name": "Forest Goblin", "level": 1, "hp": 200, "attack": 30, "icon": "👺"}]'::jsonb,
   '{"gold": 100, "gems": 5, "playerXp": 50}'::jsonb,
   1, 8, 75),

  ('1-2', 'chapter_1', 2, 'Goblin Camp', 10,
   '[{"name": "Goblin Warrior", "level": 2, "hp": 300, "attack": 40, "icon": "👹"}, {"name": "Forest Goblin", "level": 1, "hp": 200, "attack": 30, "icon": "👺"}, {"name": "Forest Goblin", "level": 2, "hp": 220, "attack": 35, "icon": "👺"}]'::jsonb,
   '{"gold": 150, "gems": 5, "playerXp": 75}'::jsonb,
   2, 15, 55),

  ('1-3', 'chapter_1', 3, 'Vallis Silens', 10,
   '[{"name": "Shadow Wolf", "level": 3, "hp": 350, "attack": 55, "icon": "🐺"}, {"name": "Shadow Wolf", "level": 3, "hp": 350, "attack": 55, "icon": "🐺"}]'::jsonb,
   '{"gold": 200, "gems": 8, "playerXp": 100}'::jsonb,
   3, 25, 42),

  ('1-4', 'chapter_1', 4, 'Dark Hollow', 10,
   '[{"name": "Dark Bat", "level": 4, "hp": 250, "attack": 65, "icon": "🦇"}, {"name": "Dark Bat", "level": 4, "hp": 250, "attack": 65, "icon": "🦇"}, {"name": "Cave Spider", "level": 4, "hp": 400, "attack": 50, "icon": "🕷️"}]'::jsonb,
   '{"gold": 250, "gems": 10, "playerXp": 125}'::jsonb,
   4, 35, 55),

  ('1-5', 'chapter_1', 5, 'Ancient Ruins', 10,
   '[{"name": "Stone Golem", "level": 5, "hp": 800, "attack": 70, "icon": "🗿"}, {"name": "Skeleton Archer", "level": 5, "hp": 300, "attack": 80, "icon": "💀"}]'::jsonb,
   '{"gold": 300, "gems": 12, "playerXp": 150}'::jsonb,
   5, 42, 68),

  ('1-6', 'chapter_1', 6, 'River Crossing', 10,
   '[{"name": "Water Serpent", "level": 6, "hp": 500, "attack": 85, "icon": "🐍"}, {"name": "Water Serpent", "level": 6, "hp": 500, "attack": 85, "icon": "🐍"}, {"name": "River Troll", "level": 6, "hp": 700, "attack": 75, "icon": "🧌"}]'::jsonb,
   '{"gold": 350, "gems": 15, "playerXp": 175}'::jsonb,
   6, 50, 82),

  ('1-7', 'chapter_1', 7, 'Bandit Fortress', 10,
   '[{"name": "Bandit Leader", "level": 7, "hp": 900, "attack": 100, "icon": "🥷"}, {"name": "Bandit Archer", "level": 7, "hp": 400, "attack": 90, "icon": "🏹"}, {"name": "Bandit Thug", "level": 7, "hp": 600, "attack": 80, "icon": "👤"}]'::jsonb,
   '{"gold": 400, "gems": 18, "playerXp": 200}'::jsonb,
   7, 62, 65),

  ('1-8', 'chapter_1', 8, 'Cursed Graveyard', 10,
   '[{"name": "Undead Knight", "level": 8, "hp": 1000, "attack": 110, "icon": "⚔️"}, {"name": "Ghost", "level": 8, "hp": 500, "attack": 120, "icon": "👻"}, {"name": "Skeleton Mage", "level": 8, "hp": 450, "attack": 130, "icon": "☠️"}]'::jsonb,
   '{"gold": 500, "gems": 20, "playerXp": 250}'::jsonb,
   8, 68, 80),

  ('1-9', 'chapter_1', 9, 'Montes Acuti', 10,
   '[{"name": "Mountain Giant", "level": 9, "hp": 1500, "attack": 130, "icon": "🏔️"}, {"name": "Rock Elemental", "level": 9, "hp": 800, "attack": 100, "icon": "🪨"}, {"name": "Eagle Warrior", "level": 9, "hp": 600, "attack": 140, "icon": "🦅"}]'::jsonb,
   '{"gold": 600, "gems": 25, "playerXp": 300}'::jsonb,
   9, 72, 50),

  ('1-10', 'chapter_1', 10, 'Dragon''s Gate', 10,
   '[{"name": "Young Dragon", "level": 10, "hp": 2000, "attack": 160, "icon": "🐉"}, {"name": "Dragon Cultist", "level": 10, "hp": 700, "attack": 120, "icon": "🧙"}, {"name": "Dragon Cultist", "level": 10, "hp": 700, "attack": 120, "icon": "🧙"}]'::jsonb,
   '{"gold": 800, "gems": 30, "playerXp": 400}'::jsonb,
   10, 62, 30);
