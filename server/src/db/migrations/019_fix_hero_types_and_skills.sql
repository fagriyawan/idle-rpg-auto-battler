-- Migration 019: Fix hero types and skill animations based on visual inspection
-- Also remove 6 heroes that have animation bugs

-- Remove bugged heroes from player_heroes and formations first
DELETE FROM player_heroes WHERE hero_template_id IN ('131611','130111','129511','129411','127811','126031');
DELETE FROM hero_templates WHERE id IN ('131611','130111','129511','129411','127811','126031');

-- Fix combat types and class types based on visual weapon inspection
-- 108111: AXE → melee warrior
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front' WHERE id = '108111';
-- 113231: FLAIL → melee warrior
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front' WHERE id = '113231';
-- 121231: SWORD → melee warrior
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front' WHERE id = '121231';
-- 122031: AXE → melee warrior
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front' WHERE id = '122031';
-- 123011: WAND → mage (magic/support)
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 350, formation_row = 'back' WHERE id = '123011';
-- 124111: SPEAR → melee warrior
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front' WHERE id = '124111';
-- 124211: LONGSWORD → melee warrior
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front' WHERE id = '124211';
-- 124511: STAFF → mage
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 320, formation_row = 'back' WHERE id = '124511';
-- 126111: magic caster → mage
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 320, formation_row = 'back' WHERE id = '126111';
-- 126231: AXE → melee warrior
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front' WHERE id = '126231';
-- 126411: FIST → melee warrior
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front' WHERE id = '126411';
-- 126911: STAFF → mage
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 320, formation_row = 'back' WHERE id = '126911';
-- 127631: SWORD → melee warrior
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front' WHERE id = '127631';
-- 128411: STAFF → mage
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 320, formation_row = 'back' WHERE id = '128411';
-- 129311: STICK healer → support
UPDATE hero_templates SET combat_type = 'support', class_type = 'support', attack_range = 300, formation_row = 'back' WHERE id = '129311';
-- 129911: SPEAR → melee warrior
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front' WHERE id = '129911';
-- 130931: STICK → mage
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 320, formation_row = 'back' WHERE id = '130931';
-- 131231: GUN → ranged
UPDATE hero_templates SET combat_type = 'ranged', class_type = 'ranger', attack_range = 350, formation_row = 'mid' WHERE id = '131231';
-- 131731: STAFF support → support
UPDATE hero_templates SET combat_type = 'support', class_type = 'support', attack_range = 300, formation_row = 'back' WHERE id = '131731';
-- 131811: STAFF → mage
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 320, formation_row = 'back' WHERE id = '131811';
-- 132031: STAFF → mage
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 320, formation_row = 'back' WHERE id = '132031';
