-- Add battle-specific data to campaign_stages
ALTER TABLE campaign_stages
  ADD COLUMN battle_time_limit INTEGER NOT NULL DEFAULT 90,
  ADD COLUMN enemy_positions JSONB NOT NULL DEFAULT '[]';

-- Update stages with enemy positions (enemies spawn on RIGHT side, x: 60-90)
UPDATE campaign_stages SET battle_time_limit = 60, enemy_positions = '[{"enemyIndex": 0, "x": 70, "y": 40}, {"enemyIndex": 1, "x": 75, "y": 60}]'::jsonb WHERE id = '1-1';
UPDATE campaign_stages SET battle_time_limit = 70, enemy_positions = '[{"enemyIndex": 0, "x": 70, "y": 30}, {"enemyIndex": 1, "x": 75, "y": 50}, {"enemyIndex": 2, "x": 72, "y": 70}]'::jsonb WHERE id = '1-2';
UPDATE campaign_stages SET battle_time_limit = 70, enemy_positions = '[{"enemyIndex": 0, "x": 72, "y": 40}, {"enemyIndex": 1, "x": 78, "y": 60}]'::jsonb WHERE id = '1-3';
UPDATE campaign_stages SET battle_time_limit = 75, enemy_positions = '[{"enemyIndex": 0, "x": 70, "y": 30}, {"enemyIndex": 1, "x": 76, "y": 50}, {"enemyIndex": 2, "x": 73, "y": 70}]'::jsonb WHERE id = '1-4';
UPDATE campaign_stages SET battle_time_limit = 80, enemy_positions = '[{"enemyIndex": 0, "x": 72, "y": 45}, {"enemyIndex": 1, "x": 78, "y": 65}]'::jsonb WHERE id = '1-5';
UPDATE campaign_stages SET battle_time_limit = 80, enemy_positions = '[{"enemyIndex": 0, "x": 70, "y": 30}, {"enemyIndex": 1, "x": 76, "y": 50}, {"enemyIndex": 2, "x": 73, "y": 70}]'::jsonb WHERE id = '1-6';
UPDATE campaign_stages SET battle_time_limit = 85, enemy_positions = '[{"enemyIndex": 0, "x": 72, "y": 35}, {"enemyIndex": 1, "x": 78, "y": 55}, {"enemyIndex": 2, "x": 74, "y": 75}]'::jsonb WHERE id = '1-7';
UPDATE campaign_stages SET battle_time_limit = 85, enemy_positions = '[{"enemyIndex": 0, "x": 70, "y": 30}, {"enemyIndex": 1, "x": 76, "y": 50}, {"enemyIndex": 2, "x": 73, "y": 70}]'::jsonb WHERE id = '1-8';
UPDATE campaign_stages SET battle_time_limit = 90, enemy_positions = '[{"enemyIndex": 0, "x": 72, "y": 35}, {"enemyIndex": 1, "x": 78, "y": 55}, {"enemyIndex": 2, "x": 74, "y": 75}]'::jsonb WHERE id = '1-9';
UPDATE campaign_stages SET battle_time_limit = 90, enemy_positions = '[{"enemyIndex": 0, "x": 70, "y": 35}, {"enemyIndex": 1, "x": 78, "y": 55}, {"enemyIndex": 2, "x": 74, "y": 75}]'::jsonb WHERE id = '1-10';

-- Update enemies JSONB to include combat stats
-- Stage 1-1: Forest Goblins (melee)
UPDATE campaign_stages SET enemies = '[{"name": "Forest Goblin", "level": 1, "hp": 200, "attack": 30, "icon": "👺", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.5, "moveSpeed": 70, "maxMana": 100, "manaRegen": 5}, {"name": "Forest Goblin", "level": 1, "hp": 200, "attack": 30, "icon": "👺", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.5, "moveSpeed": 70, "maxMana": 100, "manaRegen": 5}]'::jsonb WHERE id = '1-1';

-- Stage 1-2: Goblin Warrior (melee) + Forest Goblins (melee)
UPDATE campaign_stages SET enemies = '[{"name": "Goblin Warrior", "level": 2, "hp": 300, "attack": 40, "icon": "👹", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.3, "moveSpeed": 75, "maxMana": 100, "manaRegen": 5}, {"name": "Forest Goblin", "level": 1, "hp": 200, "attack": 30, "icon": "👺", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.5, "moveSpeed": 70, "maxMana": 100, "manaRegen": 5}, {"name": "Forest Goblin", "level": 2, "hp": 220, "attack": 35, "icon": "👺", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.5, "moveSpeed": 70, "maxMana": 100, "manaRegen": 5}]'::jsonb WHERE id = '1-2';

-- Stage 1-3: Shadow Wolves (melee, fast)
UPDATE campaign_stages SET enemies = '[{"name": "Shadow Wolf", "level": 3, "hp": 350, "attack": 55, "icon": "🐺", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.0, "moveSpeed": 100, "maxMana": 100, "manaRegen": 5}, {"name": "Shadow Wolf", "level": 3, "hp": 350, "attack": 55, "icon": "🐺", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.0, "moveSpeed": 100, "maxMana": 100, "manaRegen": 5}]'::jsonb WHERE id = '1-3';

-- Stage 1-4: Dark Bats (ranged) + Cave Spider (melee)
UPDATE campaign_stages SET enemies = '[{"name": "Dark Bat", "level": 4, "hp": 250, "attack": 65, "icon": "🦇", "combatType": "ranged", "attackRange": 180, "attackSpeed": 1.2, "moveSpeed": 85, "maxMana": 100, "manaRegen": 6}, {"name": "Dark Bat", "level": 4, "hp": 250, "attack": 65, "icon": "🦇", "combatType": "ranged", "attackRange": 180, "attackSpeed": 1.2, "moveSpeed": 85, "maxMana": 100, "manaRegen": 6}, {"name": "Cave Spider", "level": 4, "hp": 400, "attack": 50, "icon": "🕷️", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.4, "moveSpeed": 80, "maxMana": 100, "manaRegen": 5}]'::jsonb WHERE id = '1-4';

-- Stage 1-5: Stone Golem (melee, tanky) + Skeleton Archer (ranged)
UPDATE campaign_stages SET enemies = '[{"name": "Stone Golem", "level": 5, "hp": 800, "attack": 70, "icon": "🗿", "combatType": "melee", "attackRange": 50, "attackSpeed": 2.0, "moveSpeed": 50, "maxMana": 100, "manaRegen": 3}, {"name": "Skeleton Archer", "level": 5, "hp": 300, "attack": 80, "icon": "💀", "combatType": "ranged", "attackRange": 200, "attackSpeed": 1.2, "moveSpeed": 65, "maxMana": 100, "manaRegen": 7}]'::jsonb WHERE id = '1-5';

-- Stage 1-6: Water Serpents (melee) + River Troll (melee, tanky)
UPDATE campaign_stages SET enemies = '[{"name": "Water Serpent", "level": 6, "hp": 500, "attack": 85, "icon": "🐍", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.1, "moveSpeed": 90, "maxMana": 100, "manaRegen": 6}, {"name": "Water Serpent", "level": 6, "hp": 500, "attack": 85, "icon": "🐍", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.1, "moveSpeed": 90, "maxMana": 100, "manaRegen": 6}, {"name": "River Troll", "level": 6, "hp": 700, "attack": 75, "icon": "🧌", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.8, "moveSpeed": 55, "maxMana": 100, "manaRegen": 4}]'::jsonb WHERE id = '1-6';

-- Stage 1-7: Bandit Leader (melee) + Bandit Archer (ranged) + Bandit Thug (melee)
UPDATE campaign_stages SET enemies = '[{"name": "Bandit Leader", "level": 7, "hp": 900, "attack": 100, "icon": "🥷", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.2, "moveSpeed": 85, "maxMana": 100, "manaRegen": 8}, {"name": "Bandit Archer", "level": 7, "hp": 400, "attack": 90, "icon": "🏹", "combatType": "ranged", "attackRange": 200, "attackSpeed": 1.0, "moveSpeed": 70, "maxMana": 100, "manaRegen": 7}, {"name": "Bandit Thug", "level": 7, "hp": 600, "attack": 80, "icon": "👤", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.4, "moveSpeed": 75, "maxMana": 100, "manaRegen": 5}]'::jsonb WHERE id = '1-7';

-- Stage 1-8: Undead Knight (melee) + Ghost (ranged/mage) + Skeleton Mage (mage)
UPDATE campaign_stages SET enemies = '[{"name": "Undead Knight", "level": 8, "hp": 1000, "attack": 110, "icon": "⚔️", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.5, "moveSpeed": 60, "maxMana": 100, "manaRegen": 5}, {"name": "Ghost", "level": 8, "hp": 500, "attack": 120, "icon": "👻", "combatType": "mage", "attackRange": 220, "attackSpeed": 1.6, "moveSpeed": 70, "maxMana": 100, "manaRegen": 10}, {"name": "Skeleton Mage", "level": 8, "hp": 450, "attack": 130, "icon": "☠️", "combatType": "mage", "attackRange": 240, "attackSpeed": 1.8, "moveSpeed": 55, "maxMana": 100, "manaRegen": 12}]'::jsonb WHERE id = '1-8';

-- Stage 1-9: Mountain Giant (melee, boss) + Rock Elemental (melee) + Eagle Warrior (ranged)
UPDATE campaign_stages SET enemies = '[{"name": "Mountain Giant", "level": 9, "hp": 1500, "attack": 130, "icon": "🏔️", "combatType": "melee", "attackRange": 60, "attackSpeed": 2.2, "moveSpeed": 45, "maxMana": 100, "manaRegen": 4}, {"name": "Rock Elemental", "level": 9, "hp": 800, "attack": 100, "icon": "🪨", "combatType": "melee", "attackRange": 50, "attackSpeed": 1.6, "moveSpeed": 55, "maxMana": 100, "manaRegen": 5}, {"name": "Eagle Warrior", "level": 9, "hp": 600, "attack": 140, "icon": "🦅", "combatType": "ranged", "attackRange": 200, "attackSpeed": 0.9, "moveSpeed": 90, "maxMana": 100, "manaRegen": 8}]'::jsonb WHERE id = '1-9';

-- Stage 1-10: Young Dragon (melee, boss) + Dragon Cultists (mage)
UPDATE campaign_stages SET enemies = '[{"name": "Young Dragon", "level": 10, "hp": 2000, "attack": 160, "icon": "🐉", "combatType": "melee", "attackRange": 60, "attackSpeed": 1.5, "moveSpeed": 70, "maxMana": 100, "manaRegen": 10}, {"name": "Dragon Cultist", "level": 10, "hp": 700, "attack": 120, "icon": "🧙", "combatType": "mage", "attackRange": 230, "attackSpeed": 1.8, "moveSpeed": 55, "maxMana": 100, "manaRegen": 12}, {"name": "Dragon Cultist", "level": 10, "hp": 700, "attack": 120, "icon": "🧙", "combatType": "mage", "attackRange": 230, "attackSpeed": 1.8, "moveSpeed": 55, "maxMana": 100, "manaRegen": 12}]'::jsonb WHERE id = '1-10';
