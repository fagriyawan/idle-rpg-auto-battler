export interface HeroSkill {
  name: string;
  level: number;
  icon: string;
  description: string;
}

export interface HeroRune {
  id: string;
  name: string;
  icon: string;
  level: number;
}

export interface HeroDetail {
  id: string;
  name: string;
  level: number;
  stars: number;
  classType: string;
  classIcon: string;
  spine: {
    jsonUrl?: string;
    skelUrl?: string;
    atlasUrl: string;
    animation?: string;
  };
  active: boolean;
  // Extended fields for Character Detail
  attributes: {
    attack: number;
    armor: number;
    hp: number;
  };
  skills: HeroSkill[]; // [0] = attack skill, [1] = skill
  runes: (HeroRune | null)[]; // exactly 4 slots, null = empty
}

export type TabId = 'info' | 'star' | 'potential';
