/**
 * Generates and inserts wave data for all stages × difficulties into PostgreSQL.
 * Run ONCE with: npx ts-node src/db/seed-waves.ts
 */
import { pool } from "./connection";
import "../config";

interface EnemyData {
  name: string; level: number; hp: number; attack: number;
  defense: number; magicResist: number; icon: string;
  combatType: string; attackRange: number; attackSpeed: number;
  moveSpeed: number; maxMana: number; manaRegen: number;
  manaOnAttack: number; manaOnHit: number;
  critRate: number; critDamage: number;
  positionX: number; positionY: number;
}

const T = {
  goblin: { name: "Forest Goblin", icon: "👺", combatType: "melee", attackRange: 50, attackSpeed: 1.5, moveSpeed: 70, maxMana: 100, manaRegen: 5, manaOnAttack: 50, manaOnHit: 40, critRate: 3, critDamage: 1.3 },
  goblinW: { name: "Goblin Warrior", icon: "👹", combatType: "melee", attackRange: 50, attackSpeed: 1.3, moveSpeed: 75, maxMana: 100, manaRegen: 5, manaOnAttack: 60, manaOnHit: 40, critRate: 5, critDamage: 1.4 },
  wolf: { name: "Shadow Wolf", icon: "🐺", combatType: "melee", attackRange: 50, attackSpeed: 1.0, moveSpeed: 100, maxMana: 100, manaRegen: 5, manaOnAttack: 70, manaOnHit: 40, critRate: 10, critDamage: 1.5 },
  bat: { name: "Dark Bat", icon: "🦇", combatType: "ranged", attackRange: 180, attackSpeed: 1.2, moveSpeed: 85, maxMana: 100, manaRegen: 6, manaOnAttack: 60, manaOnHit: 40, critRate: 8, critDamage: 1.4 },
  spider: { name: "Cave Spider", icon: "🕷️", combatType: "melee", attackRange: 50, attackSpeed: 1.1, moveSpeed: 90, maxMana: 100, manaRegen: 5, manaOnAttack: 55, manaOnHit: 40, critRate: 12, critDamage: 1.6 },
  golem: { name: "Stone Golem", icon: "🗿", combatType: "melee", attackRange: 50, attackSpeed: 2.0, moveSpeed: 50, maxMana: 100, manaRegen: 3, manaOnAttack: 40, manaOnHit: 50, critRate: 2, critDamage: 1.2 },
  skel: { name: "Skeleton Archer", icon: "💀", combatType: "ranged", attackRange: 200, attackSpeed: 1.2, moveSpeed: 65, maxMana: 100, manaRegen: 6, manaOnAttack: 65, manaOnHit: 40, critRate: 10, critDamage: 1.5 },
  serpent: { name: "Water Serpent", icon: "🐍", combatType: "melee", attackRange: 50, attackSpeed: 1.1, moveSpeed: 90, maxMana: 100, manaRegen: 6, manaOnAttack: 60, manaOnHit: 40, critRate: 8, critDamage: 1.4 },
  troll: { name: "River Troll", icon: "🧌", combatType: "melee", attackRange: 50, attackSpeed: 1.8, moveSpeed: 60, maxMana: 100, manaRegen: 4, manaOnAttack: 45, manaOnHit: 50, critRate: 5, critDamage: 1.3 },
  bandit: { name: "Bandit Thug", icon: "👤", combatType: "melee", attackRange: 50, attackSpeed: 1.2, moveSpeed: 85, maxMana: 100, manaRegen: 7, manaOnAttack: 65, manaOnHit: 40, critRate: 10, critDamage: 1.5 },
  archer: { name: "Bandit Archer", icon: "🏹", combatType: "ranged", attackRange: 200, attackSpeed: 1.0, moveSpeed: 70, maxMana: 100, manaRegen: 7, manaOnAttack: 70, manaOnHit: 40, critRate: 15, critDamage: 1.6 },
  boss: { name: "Bandit Leader", icon: "🥷", combatType: "melee", attackRange: 50, attackSpeed: 1.2, moveSpeed: 85, maxMana: 100, manaRegen: 8, manaOnAttack: 75, manaOnHit: 40, critRate: 12, critDamage: 1.6 },
  undead: { name: "Undead Knight", icon: "⚔️", combatType: "melee", attackRange: 50, attackSpeed: 1.4, moveSpeed: 70, maxMana: 100, manaRegen: 6, manaOnAttack: 60, manaOnHit: 50, critRate: 8, critDamage: 1.5 },
  ghost: { name: "Ghost", icon: "👻", combatType: "ranged", attackRange: 200, attackSpeed: 1.3, moveSpeed: 80, maxMana: 100, manaRegen: 8, manaOnAttack: 70, manaOnHit: 40, critRate: 10, critDamage: 1.5 },
  mage: { name: "Skeleton Mage", icon: "☠️", combatType: "ranged", attackRange: 250, attackSpeed: 1.5, moveSpeed: 60, maxMana: 100, manaRegen: 10, manaOnAttack: 80, manaOnHit: 40, critRate: 8, critDamage: 1.6 },
  giant: { name: "Mountain Giant", icon: "🏔️", combatType: "melee", attackRange: 60, attackSpeed: 2.2, moveSpeed: 45, maxMana: 100, manaRegen: 3, manaOnAttack: 35, manaOnHit: 60, critRate: 5, critDamage: 1.4 },
  eagle: { name: "Eagle Warrior", icon: "🦅", combatType: "ranged", attackRange: 180, attackSpeed: 0.9, moveSpeed: 95, maxMana: 100, manaRegen: 7, manaOnAttack: 70, manaOnHit: 35, critRate: 15, critDamage: 1.7 },
  dragon: { name: "Young Dragon", icon: "🐉", combatType: "melee", attackRange: 70, attackSpeed: 1.5, moveSpeed: 80, maxMana: 100, manaRegen: 8, manaOnAttack: 80, manaOnHit: 50, critRate: 10, critDamage: 1.8 },
  cultist: { name: "Dragon Cultist", icon: "🧙", combatType: "ranged", attackRange: 220, attackSpeed: 1.4, moveSpeed: 65, maxMana: 100, manaRegen: 9, manaOnAttack: 75, manaOnHit: 40, critRate: 8, critDamage: 1.5 },
};

type TKey = keyof typeof T;

function e(t: TKey, lvl: number, px: number, py: number): EnemyData {
  const base = T[t];
  const hpMult = base.combatType === 'melee' ? 1.2 : 0.8;
  return {
    ...base, level: lvl,
    hp: Math.round((150 + lvl * 60) * hpMult),
    attack: Math.round(20 + lvl * 14),
    defense: Math.round(5 + lvl * 4),
    magicResist: Math.round(3 + lvl * 2),
    positionX: px, positionY: py,
  };
}

// Wave configs per stage (easy base). Each stage has 3 waves.
const STAGE_WAVES: Record<string, EnemyData[][]> = {
  '1-1': [
    [e('goblin',1,70,45), e('goblin',1,75,60)],
    [e('goblin',1,68,35), e('goblin',1,72,55), e('goblin',1,78,70)],
    [e('goblinW',2,70,50), e('goblin',1,78,35), e('goblin',1,78,65)],
  ],
  '1-2': [
    [e('goblin',2,70,40), e('goblin',2,70,60), e('goblinW',2,75,50)],
    [e('goblinW',2,68,45), e('goblinW',2,68,60), e('goblin',2,78,50)],
    [e('goblinW',3,70,50), e('goblinW',2,78,35), e('goblinW',2,78,65)],
  ],
  '1-3': [
    [e('wolf',3,72,40), e('wolf',3,72,60)],
    [e('wolf',3,68,35), e('wolf',3,68,55), e('wolf',3,75,70)],
    [e('wolf',4,70,50), e('wolf',3,78,35), e('wolf',3,78,65)],
  ],
  '1-4': [
    [e('bat',4,80,35), e('bat',4,80,65), e('spider',4,70,50)],
    [e('spider',4,68,40), e('spider',4,68,60), e('bat',4,82,50)],
    [e('spider',5,70,50), e('bat',4,82,35), e('bat',4,82,65)],
  ],
  '1-5': [
    [e('golem',5,70,50), e('skel',5,82,40)],
    [e('skel',5,80,35), e('skel',5,80,65), e('golem',5,68,50)],
    [e('golem',6,68,50), e('skel',5,82,35), e('skel',5,82,65)],
  ],
  '1-6': [
    [e('serpent',6,70,40), e('serpent',6,70,60)],
    [e('serpent',6,68,35), e('serpent',6,68,55), e('troll',6,75,70)],
    [e('troll',7,68,50), e('serpent',6,78,35), e('serpent',6,78,65)],
  ],
  '1-7': [
    [e('bandit',7,70,40), e('bandit',7,70,60), e('archer',7,82,50)],
    [e('bandit',7,68,35), e('archer',7,82,40), e('archer',7,82,60)],
    [e('boss',8,68,50), e('archer',7,82,35), e('bandit',7,75,65)],
  ],
  '1-8': [
    [e('undead',8,70,45), e('undead',8,70,60)],
    [e('ghost',8,80,35), e('ghost',8,80,65), e('undead',8,68,50)],
    [e('undead',9,68,50), e('mage',8,82,35), e('ghost',8,82,65)],
  ],
  '1-9': [
    [e('giant',9,68,50), e('eagle',9,82,40)],
    [e('eagle',9,80,35), e('eagle',9,80,65), e('giant',9,68,50)],
    [e('giant',10,65,50), e('eagle',9,82,35), e('eagle',9,82,65)],
  ],
  '1-10': [
    [e('cultist',10,80,35), e('cultist',10,80,65), e('dragon',10,68,50)],
    [e('dragon',10,65,45), e('cultist',10,82,35), e('cultist',10,82,55), e('cultist',10,82,70)],
    [e('dragon',12,65,50), e('cultist',10,82,35), e('cultist',10,82,65)],
  ],
};

// Difficulty multipliers
const DIFF_MULT = { easy: 1.0, hard: 1.8, nightmare: 3.0 };
const REWARD_MULT = { easy: 1.0, hard: 2.0, nightmare: 3.5 };

// Base rewards per stage (easy)
const BASE_REWARDS = [
  { gold: 100, gems: 5, playerXp: 50, heroXp: 200 },   // 1-1
  { gold: 150, gems: 5, playerXp: 75, heroXp: 250 },   // 1-2
  { gold: 200, gems: 8, playerXp: 100, heroXp: 300 },  // 1-3
  { gold: 250, gems: 10, playerXp: 125, heroXp: 350 }, // 1-4
  { gold: 300, gems: 12, playerXp: 150, heroXp: 400 }, // 1-5
  { gold: 350, gems: 15, playerXp: 175, heroXp: 450 }, // 1-6
  { gold: 400, gems: 18, playerXp: 200, heroXp: 500 }, // 1-7
  { gold: 500, gems: 20, playerXp: 250, heroXp: 600 }, // 1-8
  { gold: 600, gems: 25, playerXp: 300, heroXp: 700 }, // 1-9
  { gold: 800, gems: 30, playerXp: 400, heroXp: 800 }, // 1-10
];

function applyDifficulty(enemies: EnemyData[], mult: number): EnemyData[] {
  return enemies.map(en => ({
    ...en,
    hp: Math.round(en.hp * mult),
    attack: Math.round(en.attack * mult),
    defense: Math.round(en.defense * mult),
    magicResist: Math.round(en.magicResist * mult),
    level: Math.round(en.level * mult),
  }));
}

async function main() {
  console.log("Seeding wave data...");

  // Clear existing data
  await pool.query("DELETE FROM stage_waves");
  await pool.query("DELETE FROM stage_difficulty_rewards");
  await pool.query("DELETE FROM player_difficulty_progress");

  const difficulties = ['easy', 'hard', 'nightmare'] as const;
  const stageIds = Object.keys(STAGE_WAVES);

  // Insert waves
  let waveCount = 0;
  for (const stageId of stageIds) {
    const waves = STAGE_WAVES[stageId];
    for (const diff of difficulties) {
      const mult = DIFF_MULT[diff];
      for (let w = 0; w < 3; w++) {
        const enemies = applyDifficulty(waves[w], mult);
        await pool.query(
          `INSERT INTO stage_waves (stage_id, difficulty, wave_number, enemies)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (stage_id, difficulty, wave_number) DO UPDATE SET enemies = $4`,
          [stageId, diff, w + 1, JSON.stringify(enemies)]
        );
        waveCount++;
      }
    }
  }
  console.log(`Inserted ${waveCount} waves.`);

  // Insert rewards
  let rewardCount = 0;
  for (let i = 0; i < stageIds.length; i++) {
    const stageId = stageIds[i];
    const base = BASE_REWARDS[i];
    for (const diff of difficulties) {
      const mult = REWARD_MULT[diff];
      await pool.query(
        `INSERT INTO stage_difficulty_rewards (stage_id, difficulty, gold, gems, player_xp, hero_xp)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (stage_id, difficulty) DO UPDATE SET gold=$3, gems=$4, player_xp=$5, hero_xp=$6`,
        [stageId, diff, Math.round(base.gold * mult), Math.round(base.gems * mult),
         Math.round(base.playerXp * mult), Math.round(base.heroXp * mult)]
      );
      rewardCount++;
    }
  }
  console.log(`Inserted ${rewardCount} reward entries.`);

  console.log("Done! Wave data seeded successfully.");
  await pool.end();
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
