import type { BattleUnit, BattleState, BattleStatus, DamagePopup, Projectile } from '../types/battle';

export interface BattleEngineCallbacks {
  onStateChange: (state: BattleState) => void;
  onDamage: (popup: DamagePopup) => void;
  onProjectile?: (projectile: Projectile) => void;
}

interface PendingDamage {
  attackerId: string;
  targetId: string;
  damage: number;
  isCrit: boolean;
  isHeal: boolean;
  manaToTarget: number;
  delayRemaining: number;
}

interface PendingProjectile {
  attackerId: string;
  targetId: string;
  type: 'arrow' | 'magic' | 'heal';
  delayRemaining: number;
}

export class BattleEngine {
  private units: BattleUnit[];
  private timeRemaining: number;
  private timeLimit: number;
  private status: BattleStatus;
  private animFrameId: number | null = null;
  private lastTick: number = 0;
  private lastRenderUpdate: number = 0;
  private callbacks: BattleEngineCallbacks;
  private speed: number = 1;
  private stageId: string;
  private stageTitle: string;
  private damageIdCounter: number = 0;
  private projectileIdCounter: number = 0;
  private readonly instanceId = Math.random().toString(36).slice(2, 8);

  // Intro phase: store target positions and move units from off-screen
  private targetPositions: Map<string, { x: number; y: number }> = new Map();

  // Pending events (timed inside tick loop, NO setTimeout)
  private pendingDamage: PendingDamage[] = [];
  private pendingProjectile: PendingProjectile[] = [];

  // Throttle render updates to ~30fps (33ms)
  private static readonly RENDER_INTERVAL = 33;

  // Animation timing constants (seconds)
  private static readonly ATTACK_ANIM_DURATION = 1.5;
  private static readonly MELEE_HIT_FRAME = 0.5;       // damage lands at ~0.5s for melee
  private static readonly RANGED_PROJECTILE_FRAME = 0.5; // projectile spawns at ~0.5s
  private static readonly PROJECTILE_TRAVEL_TIME = 0.3;  // projectile travel ~0.3s (damage at ~0.8s)
  private static readonly ULTIMATE_HIT_FRAME = 0.6;      // ultimate damage lands at ~0.6s

  constructor(
    units: BattleUnit[],
    timeLimit: number,
    stageId: string,
    stageTitle: string,
    callbacks: BattleEngineCallbacks,
    skipIntro: boolean = false
  ) {
    this.units = units.map((u) => ({ ...u }));
    this.timeRemaining = timeLimit;
    this.timeLimit = timeLimit;
    this.status = 'ready';
    this.stageId = stageId;
    this.stageTitle = stageTitle;
    this.callbacks = callbacks;

    if (skipIntro) {
      // Skip intro: units start at their positions, go straight to running
      for (const unit of this.units) {
        this.targetPositions.set(unit.id, { x: unit.positionX, y: unit.positionY });
        if (unit.isAlive) {
          unit.state = 'idle';
        }
      }
    } else {
      // Save target positions and move units off-screen for intro
      for (const unit of this.units) {
        this.targetPositions.set(unit.id, { x: unit.positionX, y: unit.positionY });
        // Player units start off-screen left, enemies off-screen right
        if (unit.team === 'player') {
          unit.positionX = -15;
        } else {
          unit.positionX = 115;
        }
        unit.state = 'moving'; // Start in moving state for run animation
      }
    }
  }

  start(): void {
    if (this.status !== 'ready') return;
    // If all units are already at their positions (skipIntro), go straight to running
    const allAtPosition = this.units.every(u => {
      const target = this.targetPositions.get(u.id);
      if (!target) return true;
      return Math.abs(u.positionX - target.x) < 1 && Math.abs(u.positionY - target.y) < 1;
    });
    this.status = allAtPosition ? 'running' : 'intro';
    this.lastTick = performance.now();
    this.lastRenderUpdate = this.lastTick;
    this.emitState();
    this.loop();
  }

  pause(): void {
    if (this.status !== 'running') return;
    this.status = 'paused';
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.emitState();
  }

  resume(): void {
    if (this.status !== 'paused') return;
    this.status = 'running';
    this.lastTick = performance.now();
    this.lastRenderUpdate = this.lastTick;
    this.loop();
  }

  stop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  getSpeed(): number {
    return this.speed;
  }

  getStatus(): BattleStatus {
    return this.status;
  }

  private loop = (): void => {
    if (this.status !== 'running' && this.status !== 'intro') return;

    const now = performance.now();
    const rawDelta = (now - this.lastTick) / 1000; // seconds
    // Cap delta to prevent huge jumps (e.g. tab switch)
    const deltaTime = Math.min(rawDelta, 0.1) * this.speed;
    this.lastTick = now;

    if (this.status === 'intro') {
      this.tickIntro(deltaTime);
    } else {
      this.tick(deltaTime);
    }

    // Throttle state emission to ~30fps
    if (now - this.lastRenderUpdate >= BattleEngine.RENDER_INTERVAL) {
      this.lastRenderUpdate = now;
      this.emitState();
    }

    if (this.status === 'running' || this.status === 'intro') {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  };

  private tickIntro(deltaTime: number): void {
    let allArrived = true;
    const introSpeed = 25; // % per second — fast run-in

    for (const unit of this.units) {
      const target = this.targetPositions.get(unit.id);
      if (!target) continue;

      const dx = target.x - unit.positionX;
      const dy = target.y - unit.positionY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.5) {
        allArrived = false;
        unit.state = 'moving';
        const moveAmount = introSpeed * deltaTime;
        const ratio = Math.min(moveAmount / dist, 1);
        unit.positionX += dx * ratio;
        unit.positionY += dy * ratio;
      } else {
        // Arrived at target position
        unit.positionX = target.x;
        unit.positionY = target.y;
        unit.state = 'idle';
      }
    }

    if (allArrived) {
      this.status = 'running';
      // Reset all units to idle
      for (const unit of this.units) {
        if (unit.isAlive) unit.state = 'idle';
      }
      this.emitState();
    }
  }

  private tick(deltaTime: number): void {
    // Update timer
    this.timeRemaining -= deltaTime;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.status = 'timeout';
      this.emitState();
      return;
    }

    // Process pending projectile spawns (decoupled from animation start)
    this.processPendingProjectiles(deltaTime);

    // Process pending damage (decoupled from attack fire to match animation timing)
    this.processPendingDamage(deltaTime);

    // Update each alive unit
    for (const unit of this.units) {
      if (!unit.isAlive) continue;
      this.updateUnit(unit, deltaTime);
    }

    // Check battle end
    this.checkBattleEnd();
  }

  private processPendingProjectiles(deltaTime: number): void {
    if (this.pendingProjectile.length === 0) return;
    const remaining: PendingProjectile[] = [];
    for (const p of this.pendingProjectile) {
      p.delayRemaining -= deltaTime;
      if (p.delayRemaining <= 0) {
        const attacker = this.units.find((u) => u.id === p.attackerId);
        const target = this.units.find((u) => u.id === p.targetId);
        if (attacker && target && target.isAlive && this.callbacks.onProjectile) {
          this.projectileIdCounter++;
          this.callbacks.onProjectile({
            id: `proj_${this.instanceId}_${this.projectileIdCounter}`,
            fromX: attacker.positionX,
            fromY: attacker.positionY,
            toX: target.positionX,
            toY: target.positionY,
            type: p.type,
            timestamp: performance.now(),
          });
        }
      } else {
        remaining.push(p);
      }
    }
    this.pendingProjectile = remaining;
  }

  private processPendingDamage(deltaTime: number): void {
    if (this.pendingDamage.length === 0) return;
    const remaining: PendingDamage[] = [];
    for (const d of this.pendingDamage) {
      d.delayRemaining -= deltaTime;
      if (d.delayRemaining <= 0) {
        const target = this.units.find((u) => u.id === d.targetId);
        if (!target) continue;
        if (d.isHeal) {
          target.hp = Math.min(target.maxHp, target.hp + d.damage);
        } else if (target.isAlive) {
          target.hp -= d.damage;
          if (target.hp <= 0) {
            target.hp = 0;
            target.isAlive = false;
            target.state = 'dead';
          } else {
            // Mana on hit (only for non-fatal hits)
            target.mana = Math.min(target.maxMana, target.mana + d.manaToTarget);
          }
        }
        // Spawn damage popup
        this.damageIdCounter++;
        this.callbacks.onDamage({
          id: `dmg_${this.instanceId}_${this.damageIdCounter}`,
          x: target.positionX,
          y: target.positionY,
          value: d.damage,
          isCrit: d.isCrit,
          isHeal: d.isHeal,
          timestamp: performance.now(),
        });
      } else {
        remaining.push(d);
      }
    }
    this.pendingDamage = remaining;
  }

  private updateUnit(unit: BattleUnit, deltaTime: number): void {
    // 1. Passive mana regen
    unit.mana = Math.min(unit.maxMana, unit.mana + unit.manaRegen * deltaTime);

    // 2. If casting (skill animation playing), count down and skip other logic
    if (unit.castingTimer > 0) {
      unit.castingTimer -= deltaTime;
      unit.state = 'casting';
      return;
    }

    // 3. Find target
    const target = this.findTarget(unit);
    if (!target) {
      unit.state = 'idle';
      unit.targetId = null;
      return;
    }

    unit.targetId = target.id;

    // 3. Calculate 2D distance to target
    const dx = Math.abs(unit.positionX - target.positionX);
    const dy = Math.abs(unit.positionY - target.positionY);
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 4. Melee must be face-to-face (5%), ranged can attack from far
    const isMelee = unit.combatType === 'melee' || unit.combatType === 'warrior';
    const attackRangePercent = isMelee ? 5 : unit.attackRange / 10;

    // 5. If out of range, move toward target
    if (dist > attackRangePercent) {
      this.moveToTarget(unit, target, deltaTime);
    } else {
      // In range — stop moving, attack
      unit.state = 'attacking';
      this.tryAttack(unit, target, deltaTime);
    }
  }

  private findTarget(unit: BattleUnit): BattleUnit | null {
    const enemies = this.units.filter(
      (u) => u.isAlive && u.team !== unit.team
    );
    if (enemies.length === 0) return null;

    // Find nearest enemy by X distance (horizontal priority)
    // This ensures melee units attack the closest enemy in front of them
    let nearest: BattleUnit | null = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
      // Use 2D distance (Euclidean) for proper targeting
      const dx = unit.positionX - enemy.positionX;
      const dy = unit.positionY - enemy.positionY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  private moveToTarget(unit: BattleUnit, target: BattleUnit, deltaTime: number): void {
    unit.state = 'moving';

    // moveSpeed in pixels/sec → convert to %/sec: moveSpeed / 10
    const speedPercent = unit.moveSpeed / 10;
    const moveAmount = speedPercent * deltaTime;

    // Move toward target in 2D (both X and Y)
    const dx = target.positionX - unit.positionX;
    const dy = target.positionY - unit.positionY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.5) {
      const ratio = Math.min(moveAmount / dist, 1);
      unit.positionX += dx * ratio;
      unit.positionY += dy * ratio;
    }
  }

  private tryAttack(unit: BattleUnit, target: BattleUnit, deltaTime: number): void {
    // Reduce cooldown
    unit.attackCooldown = Math.max(0, unit.attackCooldown - deltaTime);

    // Check if should cast ultimate
    if (unit.mana >= unit.maxMana) {
      this.castUltimate(unit);
      return;
    }

    // Fire attack when cooldown is ready
    if (unit.attackCooldown <= 0) {
      // Increment attack count (used by canvas to trigger animation one-shot)
      unit.attackCount++;

      // Reset cooldown — must be at least the attack animation duration
      // so we don't trigger a new attack while previous animation is still playing.
      unit.attackCooldown = Math.max(unit.attackSpeed, BattleEngine.ATTACK_ANIM_DURATION);

      // Self-mana gain happens immediately on swing
      unit.mana = Math.min(unit.maxMana, unit.mana + unit.manaOnAttack);

      // Determine if ranged
      const isRanged = unit.combatType === 'ranged' || unit.combatType === 'ranger' ||
                       unit.combatType === 'mage' || unit.combatType === 'support' ||
                       unit.combatType === 'healer';

      // Pre-calculate damage now so it reflects state at swing time,
      // but apply it on a delay to sync with animation hit frame.
      const { damage, isCrit } = this.calculateDamage(unit, target);

      if (isRanged) {
        // Projectile spawns at hit-frame, then travels for PROJECTILE_TRAVEL_TIME,
        // damage applies when projectile lands.
        this.pendingProjectile.push({
          attackerId: unit.id,
          targetId: target.id,
          type: unit.combatType === 'mage' ? 'magic' : 'arrow',
          delayRemaining: BattleEngine.RANGED_PROJECTILE_FRAME,
        });
        this.pendingDamage.push({
          attackerId: unit.id,
          targetId: target.id,
          damage,
          isCrit,
          isHeal: false,
          manaToTarget: target.manaOnHit,
          delayRemaining: BattleEngine.RANGED_PROJECTILE_FRAME + BattleEngine.PROJECTILE_TRAVEL_TIME,
        });
      } else {
        // Melee: damage lands at hit-frame
        this.pendingDamage.push({
          attackerId: unit.id,
          targetId: target.id,
          damage,
          isCrit,
          isHeal: false,
          manaToTarget: target.manaOnHit,
          delayRemaining: BattleEngine.MELEE_HIT_FRAME,
        });
      }
    }
  }

  /** Calculate damage without applying it. */
  private calculateDamage(attacker: BattleUnit, target: BattleUnit): { damage: number; isCrit: boolean } {
    const baseDamage = attacker.attack;

    // Determine if magic or physical
    const isMagic = attacker.combatType === 'mage';
    const resistance = isMagic ? target.magicResist : target.defense;

    let damage = Math.max(1, baseDamage - resistance);

    // Crit check
    const isCrit = Math.random() * 100 < attacker.critRate;
    if (isCrit) {
      damage = Math.round(damage * attacker.critDamage);
    }

    return { damage, isCrit };
  }

  private castUltimate(unit: BattleUnit): void {
    unit.state = 'casting';
    unit.attackCount++; // Trigger skill animation in canvas
    unit.mana = 0;
    unit.attackCooldown = Math.max(unit.attackSpeed, BattleEngine.ATTACK_ANIM_DURATION);
    unit.castingTimer = BattleEngine.ATTACK_ANIM_DURATION; // Lock in casting state for skill duration

    const enemies = this.units.filter((u) => u.isAlive && u.team !== unit.team);
    const allies = this.units.filter((u) => u.isAlive && u.team === unit.team);

    const queueDamage = (target: BattleUnit, damage: number, isHeal: boolean) => {
      this.pendingDamage.push({
        attackerId: unit.id,
        targetId: target.id,
        damage,
        isCrit: false,
        isHeal,
        manaToTarget: 0,
        delayRemaining: BattleEngine.ULTIMATE_HIT_FRAME,
      });
    };

    /** Queue a projectile from caster → target with skill timing. */
    const queueSkillProjectile = (target: BattleUnit, type: 'arrow' | 'magic' | 'heal') => {
      this.pendingProjectile.push({
        attackerId: unit.id,
        targetId: target.id,
        type,
        delayRemaining: BattleEngine.RANGED_PROJECTILE_FRAME,
      });
    };

    switch (unit.combatType) {
      case 'melee':
      case 'warrior': {
        // AoE damage to 2 nearest enemies (2x attack) — no projectile (melee)
        const sorted = [...enemies].sort(
          (a, b) => this.getDistance(unit, a) - this.getDistance(unit, b)
        );
        const targets = sorted.slice(0, 2);
        for (const t of targets) {
          const damage = Math.max(1, unit.attack * 2 - t.defense);
          queueDamage(t, damage, false);
        }
        break;
      }
      case 'ranged':
      case 'ranger': {
        // Single target massive damage (3x attack) to lowest HP enemy
        if (enemies.length > 0) {
          const lowestHp = enemies.reduce((a, b) => (a.hp < b.hp ? a : b));
          const damage = Math.max(1, unit.attack * 3 - lowestHp.defense);
          queueSkillProjectile(lowestHp, 'arrow');
          queueDamage(lowestHp, damage, false);
        }
        break;
      }
      case 'mage': {
        // AoE damage to ALL enemies (1.5x attack, magic damage)
        for (const t of enemies) {
          const damage = Math.max(1, Math.round(unit.attack * 1.5) - t.magicResist);
          queueSkillProjectile(t, 'magic');
          queueDamage(t, damage, false);
        }
        break;
      }
      case 'support':
      case 'healer': {
        // Heal ALL allies for 30% of their maxHp
        for (const ally of allies) {
          const healAmount = Math.round(ally.maxHp * 0.3);
          queueSkillProjectile(ally, 'heal');
          queueDamage(ally, healAmount, true);
        }
        break;
      }
      default: {
        // Default: single target damage (2x)
        if (enemies.length > 0) {
          const target = enemies[0];
          const damage = Math.max(1, unit.attack * 2 - target.defense);
          queueSkillProjectile(target, 'arrow');
          queueDamage(target, damage, false);
        }
        break;
      }
    }
  }

  private checkBattleEnd(): void {
    const playerAlive = this.units.some((u) => u.team === 'player' && u.isAlive);
    const enemyAlive = this.units.some((u) => u.team === 'enemy' && u.isAlive);

    if (!enemyAlive) {
      this.status = 'victory';
      this.stop();
      this.emitState();
    } else if (!playerAlive) {
      this.status = 'defeat';
      this.stop();
      this.emitState();
    }
  }

  private getDistance(a: BattleUnit, b: BattleUnit): number {
    const dx = a.positionX - b.positionX;
    const dy = a.positionY - b.positionY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private emitState(): void {
    this.callbacks.onStateChange({
      units: this.units.map((u) => ({ ...u })),
      timeRemaining: this.timeRemaining,
      timeLimit: this.timeLimit,
      status: this.status,
      stageId: this.stageId,
      stageTitle: this.stageTitle,
    });
  }

  /** Calculate star rating on victory */
  static calculateStars(timeRemaining: number, timeLimit: number): number {
    if (timeRemaining > timeLimit * 0.66) return 3;
    if (timeRemaining > timeLimit * 0.33) return 2;
    return 1;
  }
}
