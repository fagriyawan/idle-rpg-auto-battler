/**
 * Frontend TypeScript interfaces for player data API responses.
 * These match the backend response shapes with camelCase field names.
 */

export interface PlayerProfile {
  id: string;
  walletAddress: string;
  displayName: string | null;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  resources: PlayerResources;
}

export interface PlayerResources {
  gold: number;
  gems: number;
  energy: number;
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

export interface HeroDetail {
  id: string;
  heroTemplateId: string;
  name: string;
  level: number;
  stars: number;
  classType: string;
  attributes: HeroAttributes;
  skills: HeroSkill[];
  runes: (HeroRune | null)[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSummary {
  id: string;
  name: string;
  level: number;
  classType: string;
}

export interface FormationPosition {
  heroId: string;
  x: number; // 0-100 percentage from left
  y: number; // 0-100 percentage from top
}

export interface Formation {
  heroIds: string[];
  positions: FormationPosition[];
  updatedAt: string;
}

export interface PlayerProfileResponse {
  profile: PlayerProfile | null;
  heroes: HeroSummary[];
  formation: Formation;
}
