import { query } from "../db/connection";

export interface TemplateSkill {
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
}

export interface HeroTemplate {
  id: string;
  name: string;
  classType: string;
  baseAttack: number;
  baseArmor: number;
  baseHp: number;
  attackSkillName: string;
  attackSkillDescription: string;
  attackSkillIcon: string;
  skills: TemplateSkill[];
  spineAssetKey: string | null;
  attackRange: number;
  attackSpeed: number;
  moveSpeed: number;
  maxMana: number;
  manaRegen: number;
  manaOnAttack: number;
  manaOnHit: number;
  critRate: number;
  critDamage: number;
  magicResistance: number;
  combatType: string;
  formationRow: string;
}

interface HeroTemplateRow {
  id: string;
  name: string;
  class_type: string;
  base_attack: number;
  base_armor: number;
  base_hp: number;
  attack_skill_name: string;
  attack_skill_description: string;
  attack_skill_icon: string;
  skills: TemplateSkill[];
  spine_asset_key: string | null;
  attack_range: number;
  attack_speed: number;
  move_speed: number;
  max_mana: number;
  mana_regen: number;
  mana_on_attack: number;
  mana_on_hit: number;
  crit_rate: number;
  crit_damage: number;
  magic_resistance: number;
  combat_type: string;
  formation_row: string;
  created_at: Date;
}

function mapRowToTemplate(row: HeroTemplateRow): HeroTemplate {
  return {
    id: row.id,
    name: row.name,
    classType: row.class_type,
    baseAttack: row.base_attack,
    baseArmor: row.base_armor,
    baseHp: row.base_hp,
    attackSkillName: row.attack_skill_name,
    attackSkillDescription: row.attack_skill_description,
    attackSkillIcon: row.attack_skill_icon,
    skills: row.skills,
    spineAssetKey: row.spine_asset_key,
    attackRange: row.attack_range,
    attackSpeed: row.attack_speed,
    moveSpeed: row.move_speed,
    maxMana: row.max_mana,
    manaRegen: row.mana_regen,
    manaOnAttack: row.mana_on_attack,
    manaOnHit: row.mana_on_hit,
    critRate: row.crit_rate,
    critDamage: row.crit_damage,
    magicResistance: row.magic_resistance,
    combatType: row.combat_type,
    formationRow: row.formation_row,
  };
}

/**
 * Returns all hero templates ordered by id.
 */
export async function getAllTemplates(): Promise<HeroTemplate[]> {
  const result = await query<HeroTemplateRow>(
    "SELECT * FROM hero_templates ORDER BY id ASC"
  );
  return result.rows.map(mapRowToTemplate);
}

/**
 * Returns a single hero template by id, or null if not found.
 */
export async function getTemplateById(id: string): Promise<HeroTemplate | null> {
  const result = await query<HeroTemplateRow>(
    "SELECT * FROM hero_templates WHERE id = $1",
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToTemplate(result.rows[0]);
}

/**
 * Returns ALL hero templates as starter templates (give all 27 heroes to new players).
 */
export async function getStarterTemplates(): Promise<HeroTemplate[]> {
  const result = await query<HeroTemplateRow>(
    "SELECT * FROM hero_templates ORDER BY id ASC"
  );
  return result.rows.map(mapRowToTemplate);
}
