export interface PlayerProfile {
  id: string;
  walletAddress: string;
  displayName: string | null;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  resources: PlayerResources;
  createdAt: string;
  lastLoginAt: string;
}

export interface PlayerResources {
  gold: number;
  gems: number;
  energy: number;
}

export interface PlayerHero {
  id: string;
  heroTemplateId: string;
  name: string;
  level: number;
  stars: number;
  classType: string;
  attributes: HeroAttributes;
  skills: HeroSkill[];
  runes: (HeroRune | null)[];
  experience: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeroAttributes {
  attack: number;
  armor: number;
  hp: number;
}

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

export interface FormationPosition {
  heroId: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

export interface Formation {
  heroIds: string[];
  positions: FormationPosition[];
  updatedAt: string;
}
