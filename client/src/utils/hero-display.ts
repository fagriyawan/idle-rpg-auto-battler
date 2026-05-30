/**
 * Utility functions for mapping server hero data to display properties.
 * Maps classType to icons and heroTemplateId to spine asset URLs.
 */

/** Maps a hero classType to a display icon */
export function getClassIcon(classType: string): string {
  switch (classType.toLowerCase()) {
    case 'warrior':
      return '⚔️';
    case 'mage':
      return '🔮';
    case 'ranger':
    case 'archer':
      return '🏹';
    case 'healer':
    case 'support':
      return '💚';
    default:
      return '🧙';
  }
}

export interface SpineAssetUrls {
  jsonUrl?: string;
  skelUrl?: string;
  atlasUrl: string;
  animation?: string;
}

// Animation prefix mapping per character
const ANIM_PREFIX: Record<string, string> = {
  '108111': '03',
  '113231': '28',
  '121231': '40',
  '122031': '03',
  '123011': '44',
  '124111': '06',
  '124211': '05',
  '124511': '21',
  '126031': '04',
  '126111': '53',
  '126231': '03',
  '126411': '01',
  '126911': '21',
  '127631': '04',
  '127811': '47',
  '128411': '21',
  '129311': '07',
  '129411': '02',
  '129511': '01',
  '129911': '48',
  '130111': '09',
  '130931': '07',
  '131231': '54',
  '131611': '04',
  '131731': '53',
  '131811': '21',
  '132031': '21',
};

/**
 * Gets the run animation name for a hero template.
 */
export function getRunAnimation(heroTemplateId: string): string {
  const prefix = ANIM_PREFIX[heroTemplateId];
  return prefix ? `${prefix}_run` : 'run';
}

/**
 * Gets the skill animation name for a hero template.
 * Each hero has a manually selected skill animation that works in-place.
 */
export function getSkillAnimation(heroTemplateId: string): string {
  const baseId = heroTemplateId.slice(0, 4) + '01';

  // Per-hero skill animation selection (manually verified to not teleport)
  const SKILL_MAP: Record<string, string> = {
    '108111': `108101_skill0`,
    '113231': `113201_skill1`,
    '121231': `121201_skill2`,
    '122031': `122001_skill2`,
    '123011': `123001_skill2`,
    '124111': `124101_skill1`,
    '124211': `124201_skill1`,
    '124511': `124501_skill0`,
    '126111': `126101_skill1`,
    '126231': `126201_skill1`,
    '126411': `126401_skill2`,  // fallback from skillSp2
    '126911': `126901_skill2`,
    '127631': `127601_skill1`,
    '128411': `128401_skill1`,
    '129311': `129301_skill2`,
    '129911': `129901_skill1`,
    '130931': `130901_skill1`,
    '131231': `131201_skill1`,  // fallback from skillSp1
    '131731': `131701_skill1`,
    '131811': `131801_skill2`,
    '132031': `132001_skill1`,
  };

  return SKILL_MAP[heroTemplateId] || `${baseId}_skill1`;
}

/**
 * Gets the idle animation name for a hero template.
 */
export function getIdleAnimation(heroTemplateId: string): string {
  const prefix = ANIM_PREFIX[heroTemplateId];
  return prefix ? `${prefix}_idle` : 'idle';
}

/**
 * Gets the attack animation name for a hero template.
 */
export function getAttackAnimation(heroTemplateId: string): string {
  const prefix = ANIM_PREFIX[heroTemplateId];
  return prefix ? `${prefix}_attack` : 'attack';
}

/**
 * Gets the die animation name for a hero template.
 */
export function getDieAnimation(heroTemplateId: string): string {
  const prefix = ANIM_PREFIX[heroTemplateId];
  return prefix ? `${prefix}_die` : 'die';
}

/**
 * Gets the joy animation name for a hero template.
 */
export function getJoyAnimation(heroTemplateId: string): string {
  const prefix = ANIM_PREFIX[heroTemplateId];
  return prefix ? `${prefix}_joy_short` : 'joy_short';
}

/**
 * Maps a heroTemplateId to spine asset URLs.
 */
export function getSpineAssets(heroTemplateId: string): SpineAssetUrls {
  const prefix = ANIM_PREFIX[heroTemplateId];
  if (prefix) {
    return {
      jsonUrl: `/assets/heroes/used_char/${heroTemplateId}/${heroTemplateId}.json`,
      atlasUrl: `/assets/heroes/used_char/${heroTemplateId}/${heroTemplateId}.atlas`,
      animation: `${prefix}_idle`,
    };
  }

  // Fallback for unknown templates
  return {
    jsonUrl: `/assets/heroes/used_char/108111/108111.json`,
    atlasUrl: `/assets/heroes/used_char/108111/108111.atlas`,
    animation: '03_idle',
  };
}
