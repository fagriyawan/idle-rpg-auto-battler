export interface BattleUnit {
  id: string;
  name: string;
  team: 'player' | 'enemy';
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  magicResist: number;
  attackRange: number;
  attackSpeed: number;
  moveSpeed: number;
  manaRegen: number;
  manaOnAttack: number;
  manaOnHit: number;
  critRate: number;
  critDamage: number;
  combatType: string;
  positionX: number;
  positionY: number;
  icon: string;
  heroTemplateId?: string;
  isAlive: boolean;
  attackCooldown: number;
  castingTimer: number; // time remaining in casting state (skill animation lock)
  state: 'idle' | 'moving' | 'attacking' | 'casting' | 'dead';
  targetId: string | null;
  attackCount: number; // increments each attack — used to trigger animation
}

export type BattleStatus = 'loading' | 'ready' | 'intro' | 'running' | 'paused' | 'victory' | 'defeat' | 'timeout';

export interface BattleState {
  units: BattleUnit[];
  timeRemaining: number;
  timeLimit: number;
  status: BattleStatus;
  stageId: string;
  stageTitle: string;
}

export interface DamagePopup {
  id: string;
  x: number;
  y: number;
  value: number;
  isCrit: boolean;
  isHeal: boolean;
  timestamp: number;
}

export interface Projectile {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'arrow' | 'magic' | 'heal';
  timestamp: number;
}

export interface BattleInitData {
  stage: {
    id: string;
    title: string;
    battleTimeLimit: number;
    enemies: BattleInitEnemy[];
  };
  waves: Array<{
    waveNumber: number;
    enemies: BattleInitEnemy[];
  }>;
  playerUnits: BattleInitPlayerUnit[];
  difficulty: string;
  rewards: {
    gold: number;
    gems: number;
    playerXp: number;
    heroXp: number;
  };
}

export interface BattleInitEnemy {
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
  manaOnHit: number;
  critRate: number;
  critDamage: number;
  positionX: number;
  positionY: number;
}

export interface BattleInitPlayerUnit {
  id: string;
  heroTemplateId: string;
  name: string;
  level: number;
  stars: number;
  classType: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  magicResist: number;
  attackRange: number;
  attackSpeed: number;
  moveSpeed: number;
  maxMana: number;
  manaRegen: number;
  manaOnAttack: number;
  manaOnHit: number;
  critRate: number;
  critDamage: number;
  combatType: string;
  formationRow: string;
  positionX: number;
  positionY: number;
}
