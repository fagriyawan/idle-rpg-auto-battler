-- Add battle_time_limit to campaign_stages
ALTER TABLE campaign_stages ADD COLUMN battle_time_limit INTEGER NOT NULL DEFAULT 90;

-- Stage 1-1: 2 goblins (melee, weak)
UPDATE campaign_stages SET battle_time_limit = 60, enemies = '[
  {"name": "Forest Goblin", "level": 1, "hp": 200, "attack": 30, "defense": 10, "magicResist": 5, "icon": "👺", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.5, "moveSpeed": 130, "maxMana": 800, "manaRegen": 5, "manaOnAttack": 50, "critRate": 3, "critDamage": 1.3, "positionX": 70, "positionY": 40},
  {"name": "Forest Goblin", "level": 1, "hp": 200, "attack": 30, "defense": 10, "magicResist": 5, "icon": "👺", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.5, "moveSpeed": 130, "maxMana": 800, "manaRegen": 5, "manaOnAttack": 50, "critRate": 3, "critDamage": 1.3, "positionX": 75, "positionY": 60}
]'::jsonb WHERE id = '1-1';

-- Stage 1-2: 3 enemies (2 melee + 1 ranged)
UPDATE campaign_stages SET battle_time_limit = 70, enemies = '[
  {"name": "Goblin Warrior", "level": 2, "hp": 300, "attack": 40, "defense": 15, "magicResist": 8, "icon": "👹", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.3, "moveSpeed": 140, "maxMana": 800, "manaRegen": 5, "manaOnAttack": 55, "critRate": 5, "critDamage": 1.4, "positionX": 68, "positionY": 30},
  {"name": "Forest Goblin", "level": 2, "hp": 220, "attack": 35, "defense": 10, "magicResist": 5, "icon": "👺", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.5, "moveSpeed": 130, "maxMana": 800, "manaRegen": 5, "manaOnAttack": 50, "critRate": 3, "critDamage": 1.3, "positionX": 72, "positionY": 55},
  {"name": "Goblin Slinger", "level": 2, "hp": 180, "attack": 45, "defense": 8, "magicResist": 5, "icon": "🏹", "combatType": "ranged", "attackRange": 250, "attackSpeed": 1.6, "moveSpeed": 110, "maxMana": 800, "manaRegen": 6, "manaOnAttack": 60, "critRate": 8, "critDamage": 1.5, "positionX": 82, "positionY": 70}
]'::jsonb WHERE id = '1-2';

-- Stage 1-3: 2 wolves (fast melee)
UPDATE campaign_stages SET battle_time_limit = 70, enemies = '[
  {"name": "Shadow Wolf", "level": 3, "hp": 350, "attack": 55, "defense": 12, "magicResist": 8, "icon": "🐺", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.0, "moveSpeed": 180, "maxMana": 800, "manaRegen": 6, "manaOnAttack": 60, "critRate": 12, "critDamage": 1.6, "positionX": 72, "positionY": 35},
  {"name": "Shadow Wolf", "level": 3, "hp": 350, "attack": 55, "defense": 12, "magicResist": 8, "icon": "🐺", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.0, "moveSpeed": 180, "maxMana": 800, "manaRegen": 6, "manaOnAttack": 60, "critRate": 12, "critDamage": 1.6, "positionX": 78, "positionY": 65}
]'::jsonb WHERE id = '1-3';

-- Stage 1-4: 3 enemies (2 ranged bats + 1 melee spider)
UPDATE campaign_stages SET battle_time_limit = 75, enemies = '[
  {"name": "Dark Bat", "level": 4, "hp": 250, "attack": 65, "defense": 8, "magicResist": 10, "icon": "🦇", "combatType": "ranged", "attackRange": 250, "attackSpeed": 1.2, "moveSpeed": 150, "maxMana": 800, "manaRegen": 7, "manaOnAttack": 65, "critRate": 10, "critDamage": 1.5, "positionX": 80, "positionY": 25},
  {"name": "Dark Bat", "level": 4, "hp": 250, "attack": 65, "defense": 8, "magicResist": 10, "icon": "🦇", "combatType": "ranged", "attackRange": 250, "attackSpeed": 1.2, "moveSpeed": 150, "maxMana": 800, "manaRegen": 7, "manaOnAttack": 65, "critRate": 10, "critDamage": 1.5, "positionX": 85, "positionY": 75},
  {"name": "Cave Spider", "level": 4, "hp": 450, "attack": 50, "defense": 20, "magicResist": 5, "icon": "🕷️", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.4, "moveSpeed": 140, "maxMana": 800, "manaRegen": 5, "manaOnAttack": 55, "critRate": 8, "critDamage": 1.4, "positionX": 70, "positionY": 50}
]'::jsonb WHERE id = '1-4';

-- Stage 1-5: 2 enemies (1 tanky golem + 1 ranged skeleton)
UPDATE campaign_stages SET battle_time_limit = 80, enemies = '[
  {"name": "Stone Golem", "level": 5, "hp": 800, "attack": 70, "defense": 40, "magicResist": 20, "icon": "🗿", "combatType": "melee", "attackRange": 80, "attackSpeed": 2.0, "moveSpeed": 90, "maxMana": 800, "manaRegen": 3, "manaOnAttack": 40, "critRate": 3, "critDamage": 1.3, "positionX": 68, "positionY": 45},
  {"name": "Skeleton Archer", "level": 5, "hp": 300, "attack": 80, "defense": 12, "magicResist": 15, "icon": "💀", "combatType": "ranged", "attackRange": 300, "attackSpeed": 1.2, "moveSpeed": 110, "maxMana": 800, "manaRegen": 8, "manaOnAttack": 70, "critRate": 15, "critDamage": 1.7, "positionX": 82, "positionY": 65}
]'::jsonb WHERE id = '1-5';

-- Stage 1-6: 3 enemies (2 melee serpents + 1 ranged troll)
UPDATE campaign_stages SET battle_time_limit = 80, enemies = '[
  {"name": "Water Serpent", "level": 6, "hp": 500, "attack": 85, "defense": 18, "magicResist": 15, "icon": "🐍", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.1, "moveSpeed": 160, "maxMana": 800, "manaRegen": 7, "manaOnAttack": 60, "critRate": 10, "critDamage": 1.5, "positionX": 68, "positionY": 30},
  {"name": "Water Serpent", "level": 6, "hp": 500, "attack": 85, "defense": 18, "magicResist": 15, "icon": "🐍", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.1, "moveSpeed": 160, "maxMana": 800, "manaRegen": 7, "manaOnAttack": 60, "critRate": 10, "critDamage": 1.5, "positionX": 72, "positionY": 70},
  {"name": "River Troll", "level": 6, "hp": 700, "attack": 75, "defense": 30, "magicResist": 10, "icon": "🧌", "combatType": "ranged", "attackRange": 200, "attackSpeed": 1.8, "moveSpeed": 100, "maxMana": 800, "manaRegen": 5, "manaOnAttack": 50, "critRate": 5, "critDamage": 1.4, "positionX": 85, "positionY": 50}
]'::jsonb WHERE id = '1-6';

-- Stage 1-7: 3 enemies (1 melee leader + 1 ranged archer + 1 melee thug)
UPDATE campaign_stages SET battle_time_limit = 85, enemies = '[
  {"name": "Bandit Leader", "level": 7, "hp": 900, "attack": 100, "defense": 25, "magicResist": 15, "icon": "🥷", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.2, "moveSpeed": 150, "maxMana": 800, "manaRegen": 8, "manaOnAttack": 70, "critRate": 12, "critDamage": 1.6, "positionX": 65, "positionY": 50},
  {"name": "Bandit Archer", "level": 7, "hp": 400, "attack": 90, "defense": 12, "magicResist": 10, "icon": "🏹", "combatType": "ranged", "attackRange": 300, "attackSpeed": 1.0, "moveSpeed": 120, "maxMana": 800, "manaRegen": 8, "manaOnAttack": 75, "critRate": 18, "critDamage": 1.8, "positionX": 82, "positionY": 30},
  {"name": "Bandit Thug", "level": 7, "hp": 600, "attack": 80, "defense": 20, "magicResist": 10, "icon": "👤", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.4, "moveSpeed": 140, "maxMana": 800, "manaRegen": 6, "manaOnAttack": 55, "critRate": 8, "critDamage": 1.5, "positionX": 75, "positionY": 75}
]'::jsonb WHERE id = '1-7';

-- Stage 1-8: 3 enemies (1 melee knight + 1 ranged ghost + 1 mage skeleton)
UPDATE campaign_stages SET battle_time_limit = 85, enemies = '[
  {"name": "Undead Knight", "level": 8, "hp": 1000, "attack": 110, "defense": 35, "magicResist": 20, "icon": "⚔️", "combatType": "melee", "attackRange": 80, "attackSpeed": 1.5, "moveSpeed": 120, "maxMana": 800, "manaRegen": 6, "manaOnAttack": 55, "critRate": 8, "critDamage": 1.5, "positionX": 65, "positionY": 50},
  {"name": "Ghost", "level": 8, "hp": 500, "attack": 120, "defense": 10, "magicResist": 30, "icon": "👻", "combatType": "ranged", "attackRange": 280, "attackSpeed": 1.6, "moveSpeed": 130, "maxMana": 800, "manaRegen": 10, "manaOnAttack": 80, "critRate": 12, "critDamage": 1.6, "positionX": 80, "positionY": 25},
  {"name": "Skeleton Mage", "level": 8, "hp": 450, "attack": 130, "defense": 8, "magicResist": 25, "icon": "☠️", "combatType": "mage", "attackRange": 320, "attackSpeed": 1.8, "moveSpeed": 100, "maxMana": 800, "manaRegen": 12, "manaOnAttack": 90, "critRate": 15, "critDamage": 1.7, "positionX": 85, "positionY": 75}
]'::jsonb WHERE id = '1-8';

-- Stage 1-9: 3 enemies (1 tanky giant + 1 ranged elemental + 1 fast eagle)
UPDATE campaign_stages SET battle_time_limit = 90, enemies = '[
  {"name": "Mountain Giant", "level": 9, "hp": 1500, "attack": 130, "defense": 45, "magicResist": 25, "icon": "🏔️", "combatType": "melee", "attackRange": 80, "attackSpeed": 2.2, "moveSpeed": 80, "maxMana": 800, "manaRegen": 4, "manaOnAttack": 40, "critRate": 5, "critDamage": 1.4, "positionX": 65, "positionY": 50},
  {"name": "Rock Elemental", "level": 9, "hp": 800, "attack": 100, "defense": 30, "magicResist": 20, "icon": "🪨", "combatType": "ranged", "attackRange": 250, "attackSpeed": 1.6, "moveSpeed": 110, "maxMana": 800, "manaRegen": 7, "manaOnAttack": 65, "critRate": 8, "critDamage": 1.5, "positionX": 80, "positionY": 25},
  {"name": "Eagle Warrior", "level": 9, "hp": 600, "attack": 140, "defense": 15, "magicResist": 15, "icon": "🦅", "combatType": "ranged", "attackRange": 280, "attackSpeed": 0.9, "moveSpeed": 180, "maxMana": 800, "manaRegen": 9, "manaOnAttack": 75, "critRate": 20, "critDamage": 1.9, "positionX": 85, "positionY": 75}
]'::jsonb WHERE id = '1-9';

-- Stage 1-10: 3 enemies (1 boss dragon + 2 mage cultists)
UPDATE campaign_stages SET battle_time_limit = 90, enemies = '[
  {"name": "Young Dragon", "level": 10, "hp": 2000, "attack": 160, "defense": 50, "magicResist": 35, "icon": "🐉", "combatType": "melee", "attackRange": 100, "attackSpeed": 1.5, "moveSpeed": 130, "maxMana": 1000, "manaRegen": 10, "manaOnAttack": 80, "critRate": 12, "critDamage": 1.8, "positionX": 65, "positionY": 50},
  {"name": "Dragon Cultist", "level": 10, "hp": 700, "attack": 120, "defense": 12, "magicResist": 30, "icon": "🧙", "combatType": "mage", "attackRange": 320, "attackSpeed": 1.8, "moveSpeed": 100, "maxMana": 1000, "manaRegen": 12, "manaOnAttack": 90, "critRate": 15, "critDamage": 1.7, "positionX": 82, "positionY": 25},
  {"name": "Dragon Cultist", "level": 10, "hp": 700, "attack": 120, "defense": 12, "magicResist": 30, "icon": "🧙", "combatType": "mage", "attackRange": 320, "attackSpeed": 1.8, "moveSpeed": 100, "maxMana": 1000, "manaRegen": 12, "manaOnAttack": 90, "critRate": 15, "critDamage": 1.7, "positionX": 82, "positionY": 75}
]'::jsonb WHERE id = '1-10';
