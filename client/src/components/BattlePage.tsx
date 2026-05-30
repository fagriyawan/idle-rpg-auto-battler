import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBattleInit } from '../services/battle-api';
import { recordStageClear, type BattleRewardResult } from '../services/campaign-api';
import { BattleEngine } from '../engine/BattleEngine';
import BattleCanvas from './BattleCanvas';
import VictoryScreen from './VictoryScreen';
import type { BattleUnit, BattleState, BattleInitEnemy, BattleInitPlayerUnit, DamagePopup, Projectile } from '../types/battle';
import styles from './BattlePage.module.css';

interface BattlePageProps {
  stageId: string;
  difficulty?: string;
  onExit: () => void;
}

interface WaveData {
  waveNumber: number;
  enemies: BattleInitEnemy[];
}

export default function BattlePage({ stageId, difficulty = 'easy', onExit }: BattlePageProps) {
  const [battleState, setBattleState] = useState<BattleState>({
    units: [],
    timeRemaining: 0,
    timeLimit: 90,
    status: 'loading',
    stageId,
    stageTitle: '',
  });
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Wave management state
  const [currentWave, setCurrentWave] = useState(1);
  const [totalWaves, setTotalWaves] = useState(3);
  const [waveTransition, setWaveTransition] = useState(false);
  const wavesRef = useRef<WaveData[]>([]);
  const difficultyRef = useRef(difficulty);

  const engineRef = useRef<BattleEngine | null>(null);
  const token = localStorage.getItem('idle_rpg_token') || '';

  // Track time remaining across waves (shared timer)
  const sharedTimeRef = useRef(90);

  const buildEnemyUnits = useCallback((enemies: BattleInitEnemy[], waveIndex: number): BattleUnit[] => {
    return enemies.map((enemy, i) => ({
      id: `enemy_w${waveIndex}_${i}`,
      name: enemy.name,
      team: 'enemy' as const,
      hp: enemy.hp,
      maxHp: enemy.hp,
      mana: 0,
      maxMana: enemy.maxMana,
      attack: enemy.attack,
      defense: enemy.defense,
      magicResist: enemy.magicResist,
      attackRange: enemy.attackRange,
      attackSpeed: enemy.attackSpeed,
      moveSpeed: enemy.moveSpeed,
      manaRegen: enemy.manaRegen,
      manaOnAttack: enemy.manaOnAttack,
      manaOnHit: enemy.manaOnHit ?? 40,
      critRate: enemy.critRate,
      critDamage: enemy.critDamage,
      combatType: enemy.combatType,
      positionX: 60 + ((enemy.positionX - 60) / 40) * 20,
      positionY: 70 + ((enemy.positionY - 30) / 40) * 15,
      icon: enemy.icon,
      isAlive: true,
      attackCooldown: 0,
      castingTimer: 0,
      state: 'idle' as const,
      targetId: null,
      attackCount: 0,
    }));
  }, []);

  const buildPlayerUnits = useCallback((playerData: BattleInitPlayerUnit[]): BattleUnit[] => {
    return playerData.map((pu) => ({
      id: pu.id,
      name: pu.name,
      team: 'player' as const,
      hp: pu.hp,
      maxHp: pu.maxHp,
      mana: 0,
      maxMana: pu.maxMana,
      attack: pu.attack,
      defense: pu.defense,
      magicResist: pu.magicResist,
      attackRange: pu.attackRange,
      attackSpeed: pu.attackSpeed,
      moveSpeed: pu.moveSpeed,
      manaRegen: pu.manaRegen,
      manaOnAttack: pu.manaOnAttack,
      manaOnHit: pu.manaOnHit,
      critRate: pu.critRate,
      critDamage: pu.critDamage,
      combatType: pu.combatType,
      positionX: pu.positionX,
      positionY: pu.positionY,
      icon: '',
      heroTemplateId: pu.heroTemplateId,
      isAlive: true,
      attackCooldown: 0,
      castingTimer: 0,
      state: 'idle' as const,
      targetId: null,
      attackCount: 0,
    }));
  }, []);

  const loadBattle = useCallback(async () => {
    try {
      const data = await getBattleInit(token, stageId, difficulty);

      // Store wave data for later waves
      wavesRef.current = data.waves;
      difficultyRef.current = data.difficulty;
      setTotalWaves(data.waves.length);
      setCurrentWave(1);

      // Build initial units from wave 1
      const playerBattleUnits = buildPlayerUnits(data.playerUnits);
      const enemyBattleUnits = buildEnemyUnits(data.waves[0].enemies, 1);
      const units: BattleUnit[] = [...playerBattleUnits, ...enemyBattleUnits];

      sharedTimeRef.current = data.stage.battleTimeLimit;

      setBattleState({
        units,
        timeRemaining: data.stage.battleTimeLimit,
        timeLimit: data.stage.battleTimeLimit,
        status: 'ready',
        stageId: data.stage.id,
        stageTitle: data.stage.title,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load battle';
      setError(message);
    }
  }, [token, stageId, difficulty, buildPlayerUnits, buildEnemyUnits]);

  useEffect(() => {
    loadBattle();
  }, [loadBattle]);

  // Start engine for current wave
  const startEngine = useCallback((units: BattleUnit[], timeRemaining: number, stageId: string, stageTitle: string, skipIntro: boolean) => {
    // Stop any existing engine
    engineRef.current?.stop();
    engineRef.current = null;

    const engine = new BattleEngine(
      units,
      timeRemaining,
      stageId,
      stageTitle,
      {
        onStateChange: (state) => {
          sharedTimeRef.current = state.timeRemaining;
          setBattleState(state);
        },
        onDamage: (popup) => {
          setDamagePopups((prev) => [...prev, popup]);
        },
        onProjectile: (proj) => {
          setProjectiles((prev) => [...prev, proj]);
        },
      },
      skipIntro
    );
    engineRef.current = engine;
    engine.setSpeed(speed);
    engine.start();
  }, [speed]);

  // Auto-start battle when ready (first wave)
  const battleStateRef = useRef(battleState);
  battleStateRef.current = battleState;

  useEffect(() => {
    if (battleState.status !== 'ready') return;
    if (engineRef.current) return; // already started

    const initial = battleStateRef.current;
    startEngine(
      initial.units,
      initial.timeLimit,
      initial.stageId,
      initial.stageTitle,
      false // first wave has intro
    );
  }, [battleState.status, startEngine]);

  // Handle wave transitions: when all enemies die, check if more waves
  const waveTransitionRef = useRef(false);
  useEffect(() => {
    if (battleState.status !== 'victory') return;
    if (waveTransitionRef.current) return;

    // Check if there are more waves
    if (currentWave < totalWaves) {
      waveTransitionRef.current = true;
      setWaveTransition(true);

      // Show "Wave X/Y Complete" for 2 seconds, then spawn next wave
      setTimeout(() => {
        const nextWaveIndex = currentWave; // 0-indexed: currentWave is already the next index
        const nextWaveData = wavesRef.current[nextWaveIndex];
        if (!nextWaveData) return;

        // Get surviving heroes with their current HP (HP persists, mana resets)
        const survivingHeroes: BattleUnit[] = battleState.units
          .filter(u => u.team === 'player' && u.isAlive)
          .map(u => ({
            ...u,
            mana: 0, // Mana resets between waves
            attackCooldown: 0,
            castingTimer: 0,
            state: 'idle' as const,
            targetId: null,
          }));

        // Dead heroes stay dead
        const deadHeroes: BattleUnit[] = battleState.units
          .filter(u => u.team === 'player' && !u.isAlive);

        // Build new enemy units for next wave
        const newEnemies = buildEnemyUnits(nextWaveData.enemies, nextWaveIndex + 1);

        const allUnits = [...survivingHeroes, ...deadHeroes, ...newEnemies];

        setCurrentWave(nextWaveIndex + 1);
        setWaveTransition(false);
        waveTransitionRef.current = false;

        // Start new engine for next wave (skip intro — heroes already in position)
        startEngine(
          allUnits,
          sharedTimeRef.current, // continue from shared timer
          battleState.stageId,
          battleState.stageTitle,
          true // skip intro for subsequent waves
        );
      }, 2000);
    }
    // If currentWave >= totalWaves, it's a real victory — let it proceed normally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleState.status]);

  // Clean up engine on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  // Clean up old damage popups (remove after 1 second)
  useEffect(() => {
    if (damagePopups.length === 0) return;

    const interval = setInterval(() => {
      const now = performance.now();
      setDamagePopups((prev) => prev.filter((p) => now - p.timestamp < 1000));
    }, 200);

    return () => clearInterval(interval);
  }, [damagePopups.length]);

  // Clean up old projectiles (remove after 400ms)
  useEffect(() => {
    if (projectiles.length === 0) return;

    const interval = setInterval(() => {
      const now = performance.now();
      setProjectiles((prev) => prev.filter((p) => now - p.timestamp < 400));
    }, 100);

    return () => clearInterval(interval);
  }, [projectiles.length]);

  // Format time as MM:SS
  const formattedTime = useMemo(() => {
    const totalSeconds = Math.max(0, Math.floor(battleState.timeRemaining));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [battleState.timeRemaining]);

  const handleMenuClick = () => {
    engineRef.current?.pause();
    setShowPauseMenu(true);
  };

  const handleResume = () => {
    setShowPauseMenu(false);
    engineRef.current?.resume();
  };

  const handleRetreat = () => {
    engineRef.current?.stop();
    onExit();
  };

  const toggleSpeed = () => {
    const newSpeed = speed === 1 ? 2 : 1;
    setSpeed(newSpeed);
    engineRef.current?.setSpeed(newSpeed);
  };

  const [victoryResult, setVictoryResult] = useState<BattleRewardResult | null>(null);
  const claimingRef = useRef(false);

  // When battle is won (final wave), claim rewards from server (ONCE)
  useEffect(() => {
    if (battleState.status !== 'victory') return;
    if (currentWave < totalWaves) return; // not final wave yet
    if (victoryResult || claimingRef.current) return; // already claimed or in progress
    claimingRef.current = true;

    const claimRewards = async () => {
      const stars = BattleEngine.calculateStars(battleState.timeRemaining, battleState.timeLimit);
      // Get hero IDs from the battle units (player team with heroTemplateId)
      const heroIds = battleState.units
        .filter(u => u.team === 'player' && u.heroTemplateId)
        .map(u => u.id);
      try {
        const result = await recordStageClear(token, stageId, stars, heroIds, difficultyRef.current);
        setVictoryResult(result);
      } catch {
        // Fallback — show basic result
        setVictoryResult({
          progress: { stageId, stars, clearCount: 1, firstClearedAt: null, lastClearedAt: null },
          rewards: { gold: 0, gems: 0, playerXp: 0, heroXp: 0 },
          player: { levelBefore: 1, levelAfter: 1, xpBefore: 0, xpAfter: 0, xpToNextLevel: 100 },
          heroes: [],
          stars,
        });
      }
    };
    claimRewards();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleState.status, currentWave, totalWaves]);

  const handleVictoryConfirm = () => {
    onExit();
  };

  // Get HP bar color class
  const getHpColorClass = (hp: number, maxHp: number): string => {
    const ratio = hp / maxHp;
    if (ratio > 0.5) return styles.hpHigh;
    if (ratio > 0.25) return styles.hpMid;
    return styles.hpLow;
  };

  // Get unit CSS class based on state
  const getUnitStateClass = (unit: BattleUnit): string => {
    if (!unit.isAlive) return styles.unitDead;
    if (unit.state === 'attacking') return styles.unitAttacking;
    if (unit.state === 'casting') return styles.unitCasting;
    return '';
  };

  // Loading state
  if (battleState.status === 'loading' && !error) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <div className={styles.loadingText}>Preparing battle...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorText}>⚠️ {error}</div>
        <button className={styles.errorBackBtn} onClick={onExit}>
          Back to Campaign
        </button>
      </div>
    );
  }

  // Check if this is the final victory (all waves cleared)
  const isFinalVictory = battleState.status === 'victory' && currentWave >= totalWaves;

  return (
    <div className={styles.battleContainer}>
      {/* Background */}
      <div className={styles.background} />

      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.stageTitle}>
          {battleState.stageTitle}
          <span className={styles.waveIndicator}> — Wave {currentWave}/{totalWaves}</span>
        </div>
        <div className={styles.timer}>{formattedTime}</div>
        <div className={styles.topBarRight}>
          <button className={styles.speedBtn} onClick={toggleSpeed}>
            {speed === 1 ? '1x' : '2x'}
          </button>
          <button className={styles.menuBtn} onClick={handleMenuClick}>
            ☰ Menu
          </button>
        </div>
      </div>

      {/* Battlefield */}
      <div className={styles.battlefield}>
        {/* Shared PixiJS canvas for all hero spine animations + HP/mana bars */}
        <BattleCanvas
          units={battleState.units}
          width={960}
          height={540}
        />

        {/* HTML overlay only for enemies without spine */}
        {battleState.units.filter(u => !u.heroTemplateId).map((unit) => (
          <div
            key={unit.id}
            className={`${styles.unit} ${getUnitStateClass(unit)}`}
            style={{ left: `${unit.positionX}%`, top: `${unit.positionY}%` }}
          >
            {/* HP Bar */}
            <div className={styles.hpBar}>
              <div
                className={`${styles.hpFill} ${getHpColorClass(unit.hp, unit.maxHp)}`}
                style={{ width: `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%` }}
              />
            </div>

            {/* Enemy sprite */}
            <div className={styles.enemySprite}>{unit.icon}</div>

            {/* Unit Name */}
            <div className={styles.unitName}>{unit.name}</div>
          </div>
        ))}

        {/* Floating Damage Numbers */}
        {damagePopups.map((popup) => (
          <div
            key={popup.id}
            className={`${styles.damagePopup} ${popup.isCrit ? styles.damageCrit : ''} ${popup.isHeal ? styles.damageHeal : ''}`}
            style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
          >
            {popup.isHeal ? '+' : '-'}{popup.value}
          </div>
        ))}

        {/* Projectiles */}
        {projectiles.map((proj) => (
          <div
            key={proj.id}
            className={`${styles.projectile} ${styles[`projectile_${proj.type}`] || ''}`}
            style={{
              '--from-x': `${proj.fromX}%`,
              '--from-y': `${proj.fromY}%`,
              '--to-x': `${proj.toX}%`,
              '--to-y': `${proj.toY}%`,
            } as React.CSSProperties}
          />
        ))}

        {/* Wave Transition Overlay */}
        {waveTransition && (
          <div className={styles.waveTransitionOverlay}>
            <div className={styles.waveTransitionText}>
              ⚔️ Wave {currentWave}/{totalWaves} Complete!
            </div>
          </div>
        )}
      </div>

      {/* Victory Screen (only after final wave) */}
      {isFinalVictory && victoryResult && (
        <VictoryScreen result={victoryResult} onContinue={handleVictoryConfirm} />
      )}

      {/* Defeat / Timeout Overlay */}
      {(battleState.status === 'defeat' || battleState.status === 'timeout') && (
        <div className={styles.resultOverlay}>
          <div className={styles.resultCard}>
            <h2>💀 Defeat</h2>
            <p className={styles.resultText}>
              {battleState.status === 'timeout'
                ? 'Time ran out! Try a different strategy.'
                : 'Your team was defeated. Try again!'}
            </p>
            <button
              className={`${styles.resultBtn} ${styles.defeatBtn}`}
              onClick={onExit}
            >
              Back to Campaign
            </button>
          </div>
        </div>
      )}

      {/* Pause Menu Overlay */}
      {showPauseMenu && (
        <div className={styles.pauseOverlay}>
          <div className={styles.pauseMenu}>
            <div className={styles.pauseTitle}>⏸ Paused</div>
            <button
              className={`${styles.pauseBtn} ${styles.resumeBtn}`}
              onClick={handleResume}
            >
              Resume
            </button>
            <button
              className={`${styles.pauseBtn} ${styles.retreatBtn}`}
              onClick={handleRetreat}
            >
              Retreat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
