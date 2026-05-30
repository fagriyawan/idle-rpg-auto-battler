import { useEffect, useRef, useState } from 'react';
import { Application, Container } from 'pixi.js';
import { createSpineFromCache, isSpineCached } from '../utils/spine-asset-cache';
import { getJoyAnimation, getIdleAnimation } from '../utils/hero-display';
import { resolveAnimation } from '../utils/spine/animation-resolver';
import type { BattleRewardResult } from '../services/campaign-api';
import styles from './VictoryScreen.module.css';

interface VictoryScreenProps {
  result: BattleRewardResult;
  onContinue: () => void;
}

function HeroSpineSlot({ heroTemplateId }: { heroTemplateId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !heroTemplateId || !isSpineCached(heroTemplateId)) return;

    const width = 180;
    const height = 340;

    const app = new Application({
      width,
      height,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });
    app.ticker.maxFPS = 30;

    const canvas = app.view as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    el.appendChild(canvas);

    const stage = new Container();
    app.stage.addChild(stage);

    const spine = createSpineFromCache(heroTemplateId);
    if (spine) {
      spine.autoUpdate = false;
      try {
        spine.skeleton.setSkinByName('default');
        spine.skeleton.setSlotsToSetupPose();
      } catch { /* */ }

      const skelH = spine.skeleton.data.height || 1820;
      const targetH = height * 1.4;
      const scale = targetH / skelH;
      spine.scale.set(scale, scale);
      spine.position.set(width / 2, height * 0.75);

      const joyAnim = getJoyAnimation(heroTemplateId);
      const idleAnim = getIdleAnimation(heroTemplateId);
      const availableAnims = spine.skeleton.data.animations.map((a: { name: string }) => a.name);
      const resolved = resolveAnimation(availableAnims, joyAnim);
      try {
        spine.state.setAnimation(0, resolved, false);
        const idleResolved = resolveAnimation(availableAnims, idleAnim);
        spine.state.addAnimation(0, idleResolved, true, 0);
      } catch {
        const idleResolved = resolveAnimation(availableAnims, idleAnim);
        try { spine.state.setAnimation(0, idleResolved, true); } catch { /* */ }
      }

      stage.addChild(spine);
      app.ticker.add(() => {
        try { spine.update(1 / 30); } catch { /* */ }
      });
    }

    return () => {
      app.destroy(true, { children: true, texture: false, baseTexture: false });
    };
  }, [heroTemplateId]);

  return <div ref={containerRef} className={styles.heroSpineSlot} />;
}

export default function VictoryScreen({ result, onContinue }: VictoryScreenProps) {
  const [phase, setPhase] = useState<'heroes' | 'rewards'>('heroes');

  const handleNext = () => {
    if (phase === 'heroes') {
      setPhase('rewards');
    } else {
      onContinue();
    }
  };

  return (
    <div className={styles.overlay}>
      {/* WIN title */}
      <div className={styles.winTitle}>WIN!</div>
      <div className={styles.stars}>
        {[1, 2, 3].map((s) => (
          <span key={s} className={s <= result.stars ? styles.starFilled : styles.starEmpty}>★</span>
        ))}
      </div>

      {phase === 'heroes' ? (
        <div className={styles.heroesPhase}>
          {/* Player level progress */}
          <div className={styles.playerProgress}>
            <span className={styles.playerLevelLabel}>Player Lv</span>
            <span className={styles.playerLevel}>{result.player.levelAfter}</span>
            <div className={styles.xpBar}>
              <div
                className={styles.xpBarFill}
                style={{ width: `${Math.min(100, ((result.player.xpAfter - getXpForLevel(result.player.levelAfter)) / (getXpForNextLevel(result.player.levelAfter) - getXpForLevel(result.player.levelAfter))) * 100)}%` }}
              />
            </div>
            <span className={styles.xpText}>EXP +{result.rewards.playerXp}</span>
            <span className={styles.goldText}>💰 +{result.rewards.gold}</span>
          </div>

          {/* Heroes row: each hero column with spine above + card below */}
          <div className={styles.heroesRow}>
            {result.heroes.map((hero) => (
              <div key={hero.heroId} className={styles.heroColumn}>
                <HeroSpineSlot heroTemplateId={hero.heroTemplateId} />
                <div className={styles.heroCard}>
                  <div className={styles.heroName}>{hero.name.split(' ')[0]}</div>
                  <div className={styles.heroLevel}>
                    Lv {hero.levelAfter}
                    {hero.levelAfter > hero.levelBefore && (
                      <span className={styles.levelUp}> ↑</span>
                    )}
                  </div>
                  <div className={styles.heroXpBar}>
                    <div
                      className={styles.heroXpFill}
                      style={{ width: `${hero.xpToNextLevel > 0 ? Math.max(5, 100 - (hero.xpToNextLevel / (getHeroXpForNextLevel(hero.levelAfter) - getHeroXpForLevel(hero.levelAfter))) * 100) : 100}%` }}
                    />
                  </div>
                  <div className={styles.heroXpText}>+{result.rewards.heroXp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.rewardsPhase}>
          <div className={styles.rewardsTitle}>Rewards Obtained</div>
          <div className={styles.rewardsGrid}>
            <div className={styles.rewardItem}>
              <div className={styles.rewardIcon}>💰</div>
              <div className={styles.rewardValue}>×{result.rewards.gold}</div>
            </div>
            <div className={styles.rewardItem}>
              <div className={styles.rewardIcon}>💎</div>
              <div className={styles.rewardValue}>×{result.rewards.gems}</div>
            </div>
            <div className={styles.rewardItem}>
              <div className={styles.rewardIcon}>⭐</div>
              <div className={styles.rewardValue}>+{result.rewards.heroXp} Hero XP</div>
            </div>
          </div>
        </div>
      )}

      <button className={styles.continueBtn} onClick={handleNext}>
        {phase === 'heroes' ? 'Next' : 'Continue'}
      </button>
    </div>
  );
}

function getXpForLevel(level: number): number {
  return (100 * level * (level - 1)) / 2;
}

function getXpForNextLevel(level: number): number {
  return (100 * (level + 1) * level) / 2;
}

function getHeroXpForLevel(level: number): number {
  return (500 * level * (level - 1)) / 2;
}

function getHeroXpForNextLevel(level: number): number {
  return (500 * (level + 1) * level) / 2;
}
