import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Spine } from 'pixi-spine';
import { createSpineFromCache, isSpineCached } from '../utils/spine-asset-cache';
import { getIdleAnimation, getRunAnimation, getAttackAnimation, getSkillAnimation, getDieAnimation } from '../utils/hero-display';
import { resolveAnimation } from '../utils/spine/animation-resolver';
import { invalidateTexturesForNewContext } from '../utils/spine/texture-cache';
import { BattleVFX } from '../utils/battle-vfx';
import type { BattleUnit } from '../types/battle';

interface BattleCanvasProps {
  units: BattleUnit[];
  width: number;
  height: number;
}

interface UnitDisplay {
  container: Container;
  spine: Spine | null;
  hpBarBg: Graphics;
  hpBarFill: Graphics;
  manaBarBg: Graphics;
  manaBarFill: Graphics;
  nameText: Text;
  unitId: string;
  currentAnim: string;
  team: 'player' | 'enemy';
  lastAttackCount: number;
  baseScale: number;
}

const HP_BAR_WIDTH = 40;
const HP_BAR_HEIGHT = 4;
const MANA_BAR_WIDTH = 40;
const MANA_BAR_HEIGHT = 3;

const nameStyle = new TextStyle({
  fontSize: 11,
  fill: '#ffffff',
  fontWeight: 'bold',
  dropShadow: true,
  dropShadowColor: '#000000',
  dropShadowDistance: 1,
  dropShadowBlur: 2,
});

/**
 * Single shared PixiJS canvas for battle.
 * Renders all hero spines, HP bars, mana bars, and names.
 * 30fps for performance.
 */
export default function BattleCanvas({ units, width, height }: BattleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const displaysRef = useRef<Map<string, UnitDisplay>>(new Map());
  const stageRef = useRef<Container | null>(null);
  const unitsRef = useRef<BattleUnit[]>(units);
  const vfxRef = useRef<BattleVFX | null>(null);
  const [ready, setReady] = useState(false);

  // Keep units ref up to date
  unitsRef.current = units;

  // Create PixiJS Application once
  useEffect(() => {
    const container = containerRef.current;
    if (!container || width <= 0 || height <= 0) return;

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
    container.appendChild(canvas);

    const stage = new Container();
    app.stage.addChild(stage);
    stageRef.current = stage;

    // VFX layer on top of everything
    const vfx = new BattleVFX(app.stage);
    vfxRef.current = vfx;

    appRef.current = app;
    setReady(true);

    return () => {
      setReady(false);
      displaysRef.current.clear();
      stageRef.current = null;
      vfxRef.current?.destroy();
      vfxRef.current = null;
      appRef.current = null;
      app.destroy(true, { children: true, texture: false, baseTexture: false });
      invalidateTexturesForNewContext();
    };
  }, [width, height]);

  // Create unit displays when units appear
  useEffect(() => {
    if (!ready || !stageRef.current) return;

    const stage = stageRef.current;
    const displays = displaysRef.current;
    const currentUnits = unitsRef.current;
    const currentIds = new Set(currentUnits.map(u => u.id));

    // Remove displays for units that no longer exist
    for (const [id, display] of displays) {
      if (!currentIds.has(id)) {
        stage.removeChild(display.container);
        display.container.destroy({ children: true });
        displays.delete(id);
      }
    }

    // Create displays for new units (only those with spine assets)
    for (const unit of currentUnits) {
      if (displays.has(unit.id)) continue;
      // Skip units without spine — they are rendered by HTML overlay
      if (!unit.heroTemplateId || !isSpineCached(unit.heroTemplateId)) continue;

      const unitContainer = new Container();

      // Spine
      let spine: Spine | null = null;
      let baseScale = 0.1;
      spine = createSpineFromCache(unit.heroTemplateId);
      if (spine) {
        spine.autoUpdate = false;
        try {
          spine.skeleton.setSkinByName('default');
          spine.skeleton.setSlotsToSetupPose();
        } catch { /* */ }

        // Set scale once — don't change it every frame
        // Characters fill ~70% of canvas height for close-up battle view
        const skelH = spine.skeleton.data.height || 1820;
        const targetH = height * 0.70;
        baseScale = targetH / skelH;
        spine.scale.set(unit.team === 'enemy' ? -baseScale : baseScale, baseScale);

        const idleAnim = getIdleAnimation(unit.heroTemplateId);
        const availableAnims = spine.skeleton.data.animations.map((a: { name: string }) => a.name);
        const resolved = resolveAnimation(availableAnims, idleAnim);
        try { spine.state.setAnimation(0, resolved, true); } catch { /* */ }

        unitContainer.addChild(spine);
      }

      // HP Bar background — dark outline
      const hpBarBg = new Graphics();
      hpBarBg.beginFill(0x000000, 0.6);
      hpBarBg.drawRoundedRect(-HP_BAR_WIDTH / 2 - 1, -1, HP_BAR_WIDTH + 2, HP_BAR_HEIGHT + 2, 2);
      hpBarBg.endFill();
      unitContainer.addChild(hpBarBg);

      // HP Bar fill
      const hpBarFill = new Graphics();
      unitContainer.addChild(hpBarFill);

      // Mana Bar background — dark outline
      const manaBarBg = new Graphics();
      manaBarBg.beginFill(0x000000, 0.5);
      manaBarBg.drawRoundedRect(-MANA_BAR_WIDTH / 2 - 1, -1, MANA_BAR_WIDTH + 2, MANA_BAR_HEIGHT + 2, 1);
      manaBarBg.endFill();
      unitContainer.addChild(manaBarBg);

      // Mana Bar fill
      const manaBarFill = new Graphics();
      unitContainer.addChild(manaBarFill);

      // Name text
      const nameText = new Text(unit.name.length > 12 ? unit.name.slice(0, 10) + '...' : unit.name, nameStyle);
      nameText.anchor.set(0.5, 0);
      unitContainer.addChild(nameText);

      stage.addChild(unitContainer);

      displays.set(unit.id, {
        container: unitContainer,
        spine,
        hpBarBg,
        hpBarFill,
        manaBarBg,
        manaBarFill,
        nameText,
        unitId: unit.id,
        currentAnim: '',
        team: unit.team,
        lastAttackCount: 0,
        baseScale,
      });
    }
  }, [ready, units.length]);

  // Update loop — runs on ticker (only once when ready)
  useEffect(() => {
    if (!ready || !appRef.current) return;

    const app = appRef.current;
    const displays = displaysRef.current;

    const update = () => {
      const dt = 1 / 30;
      const currentUnits = unitsRef.current;

      for (const unit of currentUnits) {
        const display = displays.get(unit.id);
        if (!display) continue;

        const { container, spine, hpBarBg, hpBarFill, manaBarBg, manaBarFill, nameText } = display;

        // Position (convert % to pixels)
        const px = (unit.positionX / 100) * width;
        const py = (unit.positionY / 100) * height;
        container.position.set(px, py);

        // Visibility
        container.visible = unit.isAlive;
        if (!unit.isAlive) {
          if (display.currentAnim !== '__dead' && spine) {
            const dieAnim = unit.heroTemplateId ? getDieAnimation(unit.heroTemplateId) : '';
            try { spine.state.setAnimation(0, dieAnim, false); } catch { /* */ }
            display.currentAnim = '__dead';
            container.visible = true; // Show die animation briefly
          }
          continue;
        }

        // Scale spine — already set during creation, don't override
        if (spine) {
          // Spine position relative to container (feet at container origin)
          spine.position.set(0, 0);

          // Animation state machine driven by unit.state + attackCount
          const stateCategory = unit.state;
          const idleAnim = unit.heroTemplateId ? getIdleAnimation(unit.heroTemplateId) : '';

          if (stateCategory === 'attacking') {
            // Trigger one-shot attack animation only when attackCount increments
            if (unit.attackCount > display.lastAttackCount) {
              display.lastAttackCount = unit.attackCount;
              const attackAnim = unit.heroTemplateId ? getAttackAnimation(unit.heroTemplateId) : '';
              if (attackAnim) {
                try {
                  spine.state.setAnimation(0, attackAnim, false);
                  if (idleAnim) {
                    try { spine.state.addAnimation(0, idleAnim, true, 0); } catch { /* */ }
                  }
                } catch { /* */ }
              }
              display.currentAnim = '__attack_oneshot';

              // VFX: slash effect for melee at target position
              if (vfxRef.current && unit.targetId) {
                const targetUnit = currentUnits.find(u => u.id === unit.targetId);
                if (targetUnit) {
                  const tx = (targetUnit.positionX / 100) * width;
                  const ty = (targetUnit.positionY / 100) * height - 20;
                  const isMelee = unit.combatType === 'melee' || unit.combatType === 'warrior';
                  if (isMelee) {
                    vfxRef.current.slashEffect(tx, ty, unit.team === 'player');
                  } else {
                    // Ranged/mage normal attack — hit impact at target
                    vfxRef.current.hitImpactEffect(tx, ty, false);
                  }
                }
              }
            } else if (
              display.currentAnim !== '__attack_oneshot' &&
              display.currentAnim !== '__skill_oneshot' &&
              display.currentAnim !== 'idle'
            ) {
              // In attacking state but waiting for cooldown — show idle (not run)
              // (don't interrupt one-shot attack/skill animations)
              if (idleAnim) {
                try { spine.state.setAnimation(0, idleAnim, true); } catch { /* */ }
              }
              display.currentAnim = 'idle';
            }
          } else if (stateCategory === 'casting') {
            // Ultimate/skill — play skill animation once
            if (unit.attackCount > display.lastAttackCount) {
              display.lastAttackCount = unit.attackCount;
              const skillAnim = unit.heroTemplateId ? getSkillAnimation(unit.heroTemplateId) : '';
              if (skillAnim) {
                try {
                  spine.state.setAnimation(0, skillAnim, false);
                  if (idleAnim) {
                    try { spine.state.addAnimation(0, idleAnim, true, 0); } catch { /* */ }
                  }
                } catch { /* */ }
              }
              display.currentAnim = '__skill_oneshot';

              // VFX: skill cast effect at caster + magic burst at targets
              if (vfxRef.current) {
                const cx = (unit.positionX / 100) * width;
                const cy = (unit.positionY / 100) * height;
                vfxRef.current.skillCastEffect(cx, cy);

                // Magic burst or heal at targets
                const isHealer = unit.combatType === 'support' || unit.combatType === 'healer';
                if (isHealer) {
                  // Heal effect on allies
                  currentUnits.filter(u => u.team === unit.team && u.isAlive).forEach(ally => {
                    const ax = (ally.positionX / 100) * width;
                    const ay = (ally.positionY / 100) * height;
                    vfxRef.current!.healEffect(ax, ay);
                  });
                } else {
                  // Magic burst on enemies
                  currentUnits.filter(u => u.team !== unit.team && u.isAlive).forEach(enemy => {
                    const ex = (enemy.positionX / 100) * width;
                    const ey = (enemy.positionY / 100) * height;
                    vfxRef.current!.magicBurstEffect(ex, ey);
                  });
                }
              }
            }
          } else if (stateCategory !== display.currentAnim) {
            // moving / idle / dead — switch directly
            const animForState = getAnimForState(unit);
            if (animForState) {
              const isLoop = stateCategory === 'idle' || stateCategory === 'moving';
              try {
                spine.state.setAnimation(0, animForState, isLoop);
              } catch { /* */ }
            }
            display.currentAnim = stateCategory;
          }

          // Update spine
          try {
            spine.update(dt);
            // During skill animation, lock root bone to prevent teleport.
            // skill1/skill2 may still move root bone in some characters.
            if (display.currentAnim === '__skill_oneshot') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const root = spine.skeleton.bones[0] as any;
              if (root) {
                root.x = 0;
                root.y = 0;
                spine.skeleton.updateWorldTransform();
              }
            }
          } catch { /* */ }
        }

        // Position bars just above the character head
        const barY = -(height * 0.38);
        hpBarBg.position.set(0, barY);
        hpBarFill.position.set(0, barY);
        manaBarBg.position.set(0, barY + HP_BAR_HEIGHT + 1);
        manaBarFill.position.set(0, barY + HP_BAR_HEIGHT + 1);
        nameText.position.set(0, barY - 12);
        nameText.visible = false; // Hide name to reduce clutter

        // Update HP bar — slim with bright fill
        const hpRatio = Math.max(0, unit.hp / unit.maxHp);
        const hpColor = hpRatio > 0.5 ? 0x22dd44 : hpRatio > 0.25 ? 0xddcc22 : 0xdd3333;
        hpBarFill.clear();
        if (hpRatio > 0) {
          hpBarFill.beginFill(hpColor);
          hpBarFill.drawRoundedRect(-HP_BAR_WIDTH / 2, 0, HP_BAR_WIDTH * hpRatio, HP_BAR_HEIGHT, 2);
          hpBarFill.endFill();
        }

        // Update Mana bar — slim blue
        const manaRatio = unit.maxMana > 0 ? Math.min(1, unit.mana / unit.maxMana) : 0;
        manaBarFill.clear();
        if (manaRatio > 0) {
          manaBarFill.beginFill(0x44aaff);
          manaBarFill.drawRoundedRect(-MANA_BAR_WIDTH / 2, 0, MANA_BAR_WIDTH * manaRatio, MANA_BAR_HEIGHT, 1);
          manaBarFill.endFill();
        }
      }

      // Update VFX particles
      if (vfxRef.current) {
        vfxRef.current.update(dt);
      }
    };

    app.ticker.add(update);

    return () => {
      const currentApp = appRef.current;
      if (currentApp) {
        try { currentApp.ticker.remove(update); } catch { /* */ }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, width, height]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

/** Map unit state to the correct animation name */
function getAnimForState(unit: BattleUnit): string | null {
  if (!unit.heroTemplateId) return null;
  switch (unit.state) {
    case 'moving':
      return getRunAnimation(unit.heroTemplateId);
    case 'attacking':
      return getAttackAnimation(unit.heroTemplateId);
    case 'casting':
      return getSkillAnimation(unit.heroTemplateId);
    case 'dead':
      return getDieAnimation(unit.heroTemplateId);
    default:
      return getIdleAnimation(unit.heroTemplateId);
  }
}
