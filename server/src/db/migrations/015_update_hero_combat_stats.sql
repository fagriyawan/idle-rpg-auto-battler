-- warrior_001 Iron Knight (Tank/Melee/Front)
UPDATE hero_templates SET 
  attack_range = 80, attack_speed = 1.8, move_speed = 120,
  max_mana = 1000, mana_regen = 8, mana_on_attack = 60, mana_on_hit = 50,
  crit_rate = 5, crit_damage = 1.5, magic_resistance = 30,
  combat_type = 'melee', formation_row = 'front'
WHERE id = 'warrior_001';

-- mage_001 Arcane Sage (Mage/Ranged/Back)
UPDATE hero_templates SET 
  attack_range = 350, attack_speed = 2.0, move_speed = 100,
  max_mana = 1000, mana_regen = 15, mana_on_attack = 100, mana_on_hit = 30,
  crit_rate = 10, crit_damage = 1.8, magic_resistance = 20,
  combat_type = 'mage', formation_row = 'back'
WHERE id = 'mage_001';

-- ranger_001 Shadow Archer (Ranged/Mid)
UPDATE hero_templates SET 
  attack_range = 300, attack_speed = 1.2, move_speed = 140,
  max_mana = 1000, mana_regen = 10, mana_on_attack = 90, mana_on_hit = 35,
  crit_rate = 20, crit_damage = 2.0, magic_resistance = 10,
  combat_type = 'ranged', formation_row = 'mid'
WHERE id = 'ranger_001';

-- healer_001 Holy Priestess (Support/Back)
UPDATE hero_templates SET 
  attack_range = 300, attack_speed = 2.2, move_speed = 90,
  max_mana = 1000, mana_regen = 12, mana_on_attack = 70, mana_on_hit = 60,
  crit_rate = 3, crit_damage = 1.3, magic_resistance = 25,
  combat_type = 'support', formation_row = 'back'
WHERE id = 'healer_001';

-- warrior_002 Berserker Axe (Warrior/Melee/Front)
UPDATE hero_templates SET 
  attack_range = 80, attack_speed = 1.4, move_speed = 160,
  max_mana = 1000, mana_regen = 10, mana_on_attack = 80, mana_on_hit = 40,
  crit_rate = 15, crit_damage = 1.8, magic_resistance = 15,
  combat_type = 'melee', formation_row = 'front'
WHERE id = 'warrior_002';

-- mage_002 Frost Witch (Mage/Ranged/Back)
UPDATE hero_templates SET 
  attack_range = 320, attack_speed = 1.8, move_speed = 110,
  max_mana = 1000, mana_regen = 14, mana_on_attack = 95, mana_on_hit = 35,
  crit_rate = 12, crit_damage = 1.7, magic_resistance = 25,
  combat_type = 'mage', formation_row = 'back'
WHERE id = 'mage_002';

-- ranger_002 Wind Dancer (Ranged/Mid)
UPDATE hero_templates SET 
  attack_range = 280, attack_speed = 1.0, move_speed = 170,
  max_mana = 1000, mana_regen = 12, mana_on_attack = 85, mana_on_hit = 30,
  crit_rate = 18, crit_damage = 1.9, magic_resistance = 10,
  combat_type = 'ranged', formation_row = 'mid'
WHERE id = 'ranger_002';

-- healer_002 Nature Druid (Support/Back)
UPDATE hero_templates SET 
  attack_range = 280, attack_speed = 2.0, move_speed = 100,
  max_mana = 1000, mana_regen = 13, mana_on_attack = 75, mana_on_hit = 55,
  crit_rate = 5, crit_damage = 1.4, magic_resistance = 20,
  combat_type = 'support', formation_row = 'back'
WHERE id = 'healer_002';
