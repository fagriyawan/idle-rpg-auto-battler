export interface CampaignChapter {
  id: string;
  chapterNumber: number;
  title: string;
  description: string;
}

export interface StageEnemy {
  name: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  magicResist: number;
  icon: string;
  combatType: string;
  attackRange: number;
  attackSpeed: number;
  moveSpeed: number;
  maxMana: number;
  manaRegen: number;
  manaOnAttack: number;
  critRate: number;
  critDamage: number;
  positionX: number;
  positionY: number;
}

export interface StageRewards {
  gold: number;
  gems: number;
  playerXp: number;
  heroXp?: number;
}

export interface CampaignStage {
  id: string;
  chapterId: string;
  stageNumber: number;
  title: string;
  energyCost: number;
  enemies: StageEnemy[];
  rewards: StageRewards;
  recommendedLevel: number;
  mapPositionX: number;
  mapPositionY: number;
  battleTimeLimit: number;
}

export interface PlayerStageProgress {
  stageId: string;
  stars: number;
  clearCount: number;
  firstClearedAt: string | null;
  lastClearedAt: string | null;
}

export interface CampaignStageWithProgress extends CampaignStage {
  progress: PlayerStageProgress | null;
  unlocked: boolean;
}
