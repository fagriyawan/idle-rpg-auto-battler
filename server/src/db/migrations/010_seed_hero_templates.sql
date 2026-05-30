-- Migration 010: Seed hero_templates with initial hero definitions

INSERT INTO hero_templates (id, name, class_type, base_attack, base_armor, base_hp, attack_skill_name, attack_skill_description, attack_skill_icon, skills, spine_asset_key)
VALUES
  (
    'warrior_001',
    'Iron Knight',
    'warrior',
    120, 80, 600,
    'Shield Bash',
    'Slams the enemy with a reinforced shield, dealing damage and stunning briefly',
    '🛡️',
    '[{"name": "Fortify", "description": "Increases armor by 20% for 10 seconds", "icon": "🛡️", "maxLevel": 20}, {"name": "War Cry", "description": "Boosts team attack by 15% for 8 seconds", "icon": "📯", "maxLevel": 20}]'::jsonb,
    'warrior_001'
  ),
  (
    'mage_001',
    'Arcane Sage',
    'mage',
    150, 40, 400,
    'Arcane Bolt',
    'Launches a concentrated bolt of arcane energy at the target',
    '🔮',
    '[{"name": "Mana Shield", "description": "Creates a magical barrier absorbing 30% of incoming damage for 8 seconds", "icon": "🔵", "maxLevel": 20}, {"name": "Meteor Storm", "description": "Calls down meteors dealing massive AoE damage over 5 seconds", "icon": "☄️", "maxLevel": 20}]'::jsonb,
    'mage_001'
  ),
  (
    'ranger_001',
    'Shadow Archer',
    'ranger',
    140, 50, 450,
    'Piercing Arrow',
    'Fires an arrow that pierces through armor, ignoring 25% of defense',
    '🏹',
    '[{"name": "Evasion", "description": "Increases dodge chance by 30% for 6 seconds", "icon": "💨", "maxLevel": 20}, {"name": "Rain of Arrows", "description": "Unleashes a volley of arrows hitting all enemies for moderate damage", "icon": "🌧️", "maxLevel": 20}]'::jsonb,
    'ranger_001'
  ),
  (
    'healer_001',
    'Holy Priestess',
    'healer',
    80, 60, 500,
    'Holy Light',
    'Channels divine energy to heal the most wounded ally',
    '✨',
    '[{"name": "Healing Wave", "description": "Sends a wave of restoration healing all allies for 15% of max HP", "icon": "💚", "maxLevel": 20}, {"name": "Divine Blessing", "description": "Grants immunity to debuffs and heals over time for 6 seconds", "icon": "🙏", "maxLevel": 20}]'::jsonb,
    'healer_001'
  ),
  (
    'warrior_002',
    'Berserker Axe',
    'warrior',
    160, 50, 550,
    'Raging Slash',
    'A furious axe swing that deals increased damage the lower your HP',
    '🪓',
    '[{"name": "Blood Fury", "description": "Sacrifices 10% HP to gain 40% attack for 8 seconds", "icon": "🩸", "maxLevel": 20}, {"name": "Whirlwind", "description": "Spins rapidly dealing damage to all nearby enemies", "icon": "🌀", "maxLevel": 20}]'::jsonb,
    'warrior_002'
  ),
  (
    'mage_002',
    'Frost Witch',
    'mage',
    145, 45, 380,
    'Ice Shard',
    'Hurls a razor-sharp shard of ice that slows the target by 20%',
    '❄️',
    '[{"name": "Frost Nova", "description": "Releases a burst of frost freezing all nearby enemies for 3 seconds", "icon": "💎", "maxLevel": 20}, {"name": "Blizzard", "description": "Summons a blizzard dealing continuous ice damage and slowing enemies", "icon": "🌨️", "maxLevel": 20}]'::jsonb,
    'mage_002'
  ),
  (
    'ranger_002',
    'Wind Dancer',
    'ranger',
    135, 55, 420,
    'Gale Strike',
    'A swift wind-infused strike that hits twice in rapid succession',
    '🌬️',
    '[{"name": "Swift Step", "description": "Increases attack speed by 25% and movement speed for 7 seconds", "icon": "👟", "maxLevel": 20}, {"name": "Tornado Blade", "description": "Creates a spinning blade of wind that damages enemies in its path", "icon": "🌪️", "maxLevel": 20}]'::jsonb,
    'ranger_002'
  ),
  (
    'healer_002',
    'Nature Druid',
    'healer',
    90, 65, 520,
    'Vine Whip',
    'Lashes the enemy with thorny vines, dealing damage and applying a bleed',
    '🌿',
    '[{"name": "Rejuvenation", "description": "Places a regeneration buff healing 5% max HP every 2 seconds for 10 seconds", "icon": "🌱", "maxLevel": 20}, {"name": "Nature''s Wrath", "description": "Summons roots to entangle enemies while thorns deal damage over time", "icon": "🌳", "maxLevel": 20}]'::jsonb,
    'healer_002'
  );
