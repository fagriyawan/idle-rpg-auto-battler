-- Migration 018: Fix hero combat_type based on classMap weapon types
-- Source: https://redive.estertion.win/spine/classMap.json
-- Type 1=Sword(melee), 2=Lance(melee), 3=Bow(ranged), 4=Staff(mage), 5=Fist(melee),
-- 6=Gun(ranged), 7=Blade(melee), 8=Support, 9=Hammer(melee)
-- Type 21+ = Unique (determined by visual weapon inspection)

-- 108111 Yui Starweaver: classMap type 3 (Bow) → ranged
UPDATE hero_templates SET combat_type = 'ranged', class_type = 'ranger', attack_range = 300, formation_row = 'mid'
WHERE id = '108111';

-- 113231 Kaede Shadowblade: classMap type 28 (Unique) — visual: dual blades, fast melee assassin
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front'
WHERE id = '113231';

-- 121231 Rei Frostmoon: classMap type 40 (Unique) — visual: magic staff, casts spells
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 340, formation_row = 'back'
WHERE id = '121231';

-- 122031 Hana Ironrose: classMap type 3 (Bow) → ranged
UPDATE hero_templates SET combat_type = 'ranged', class_type = 'ranger', attack_range = 300, formation_row = 'mid'
WHERE id = '122031';

-- 123011 Miku Thunderstrike: classMap type 44 (Unique) — visual: magic caster, lightning
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 350, formation_row = 'back'
WHERE id = '123011';

-- 124111 Sora Blazeheart: classMap type 6 (Gun) → ranged
UPDATE hero_templates SET combat_type = 'ranged', class_type = 'ranger', attack_range = 300, formation_row = 'mid'
WHERE id = '124111';

-- 124211 Luna Moonwhisper: classMap type 5 (Fist) → melee
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front'
WHERE id = '124211';

-- 124511 Akira Stormrider: classMap type 21 (Unique) — visual: ranged weapon, shoots projectiles
UPDATE hero_templates SET combat_type = 'ranged', class_type = 'ranger', attack_range = 290, formation_row = 'mid'
WHERE id = '124511';

-- 126031 Rin Crystalvein: classMap type 0 (Special) — visual: magic caster, crystal magic
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 330, formation_row = 'back'
WHERE id = '126031';

-- 126111 Mei Sakurablade: classMap type 53 (Unique) — visual: sword/blade melee
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front'
WHERE id = '126111';

-- 126231 Noel Frostguard: classMap type 3 (Bow) → ranged
UPDATE hero_templates SET combat_type = 'ranged', class_type = 'ranger', attack_range = 300, formation_row = 'mid'
WHERE id = '126231';

-- 126411 Aoi Windchaser: classMap type 1 (Sword) → melee
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front'
WHERE id = '126411';

-- 126911 Kokoro Dawnbringer: classMap type 21 (Unique) — visual: staff, support/heal
UPDATE hero_templates SET combat_type = 'support', class_type = 'support', attack_range = 280, formation_row = 'back'
WHERE id = '126911';

-- 127631 Tsubaki Emberfang: classMap type 4 (Magic Staff) → mage
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 320, formation_row = 'back'
WHERE id = '127631';

-- 127811 Shizuku Tidecaller: classMap type 47 (Unique) — visual: magic caster, water spells
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 340, formation_row = 'back'
WHERE id = '127811';

-- 128411 Hikari Sunspear: classMap type 21 (Unique) — visual: ranged, shoots light arrows
UPDATE hero_templates SET combat_type = 'ranged', class_type = 'ranger', attack_range = 295, formation_row = 'mid'
WHERE id = '128411';

-- 129311 Ayame Venomthorn: classMap type 7 (Blade) → melee
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front'
WHERE id = '129311';

-- 129411 Misaki Nightbloom: classMap type 2 (Lance) → melee
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front'
WHERE id = '129411';

-- 129511 Ruka Steelmaiden: classMap type 1 (Sword) → melee (already correct)
-- No change needed

-- 129911 Chiyo Spiritdancer: classMap type 48 (Unique) — visual: magic caster, spirit flames
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 330, formation_row = 'back'
WHERE id = '129911';

-- 130111 Haruka Skybreaker: classMap type 9 (Hammer) → melee (already correct)
-- No change needed

-- 130931 Suzume Windweaver: classMap type 7 (Blade) → melee
UPDATE hero_templates SET combat_type = 'melee', class_type = 'warrior', attack_range = 80, formation_row = 'front'
WHERE id = '130931';

-- 131231 Kanna Voidwalker: classMap type 54 (Unique) — visual: magic caster, void magic
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 350, formation_row = 'back'
WHERE id = '131231';

-- 131611 Tsukasa Ironclad: classMap type 4 (Magic Staff) → mage
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 320, formation_row = 'back'
WHERE id = '131611';

-- 131731 Fumika Starshot: classMap type 53 (Unique) — visual: ranged, shoots star bolts
UPDATE hero_templates SET combat_type = 'ranged', class_type = 'ranger', attack_range = 320, formation_row = 'mid'
WHERE id = '131731';

-- 131811 Nanami Duskblade: classMap type 21 (Unique) — visual: staff weapon, casts magic
UPDATE hero_templates SET combat_type = 'mage', class_type = 'mage', attack_range = 320, formation_row = 'back'
WHERE id = '131811';

-- 132031 Sakura Dawnpriestess: classMap type 21 (Unique) — visual: staff, support/heal
UPDATE hero_templates SET combat_type = 'support', class_type = 'support', attack_range = 300, formation_row = 'back'
WHERE id = '132031';
