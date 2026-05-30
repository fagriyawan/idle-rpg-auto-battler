import { useEffect, useRef, useState } from 'react';
import { Application, Container } from 'pixi.js';
import { Spine } from 'pixi-spine';
import { createSpineFromCache, isSpineCached } from '../utils/spine-asset-cache';
import { getIdleAnimation } from '../utils/hero-display';
import { resolveAnimation } from '../utils/spine/animation-resolver';
import { invalidateTexturesForNewContext } from '../utils/spine/texture-cache';

interface HeroGridItem {
  heroTemplateId: string;
  animation?: string;
}

interface HeroesGridCanvasProps {
  heroes: HeroGridItem[];
  /** Number of columns in the grid */
  columns: number;
  /** Width of each cell */
  cellWidth: number;
  /** Height of each cell */
  cellHeight: number;
  /** Gap between cells */
  gap: number;
}

/**
 * Single shared PixiJS canvas that renders all hero spine animations in a grid.
 * Uses 1 WebGL context instead of N separate contexts.
 * 
 * The canvas is full-height (covers entire grid) and scrolls naturally
 * with the parent container — no manual scroll offset needed.
 */
export default function HeroesGridCanvas({
  heroes,
  columns,
  cellWidth,
  cellHeight,
  gap,
}: HeroesGridCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const spinesRef = useRef<(Spine | null)[]>([]);
  const gridContainerRef = useRef<Container | null>(null);
  const [ready, setReady] = useState(false);

  // Calculate full canvas dimensions
  const rows = Math.ceil(heroes.length / columns);
  const canvasWidth = columns * cellWidth + Math.max(0, columns - 1) * gap;
  const canvasHeight = rows * cellHeight + Math.max(0, rows - 1) * gap;

  // Create PixiJS Application once
  useEffect(() => {
    const container = containerRef.current;
    if (!container || canvasWidth <= 0 || canvasHeight <= 0) return;

    const app = new Application({
      width: canvasWidth,
      height: canvasHeight,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
      autoStart: false,
    });

    app.ticker.maxFPS = 30;

    const canvas = app.view as HTMLCanvasElement;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    container.appendChild(canvas);

    // Create a container for all spines
    const gridContainer = new Container();
    app.stage.addChild(gridContainer);
    gridContainerRef.current = gridContainer;

    appRef.current = app;
    setReady(true);

    return () => {
      setReady(false);
      appRef.current = null;
      gridContainerRef.current = null;
      spinesRef.current = [];
      app.destroy(true, { children: true, texture: false, baseTexture: false });
      invalidateTexturesForNewContext();
    };
  }, [canvasWidth, canvasHeight]);

  // Add spine characters to the grid when app is ready
  useEffect(() => {
    if (!ready || !appRef.current || !gridContainerRef.current) return;

    const app = appRef.current;
    const gridContainer = gridContainerRef.current;

    // Clear existing spines
    spinesRef.current.forEach((spine) => {
      if (spine && gridContainer) {
        try { gridContainer.removeChild(spine); } catch { /* already removed */ }
        spine.destroy();
      }
    });
    spinesRef.current = [];

    // Create spine for each hero from cache
    heroes.forEach((hero, index) => {
      if (!isSpineCached(hero.heroTemplateId)) {
        spinesRef.current.push(null);
        return;
      }

      const spine = createSpineFromCache(hero.heroTemplateId);
      if (!spine) {
        spinesRef.current.push(null);
        return;
      }

      // Position in grid — account for gap between cells
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = col * (cellWidth + gap) + cellWidth / 2;
      // Spine origin is at feet — position near bottom of cell area
      const y = row * (cellHeight + gap) + cellHeight * 0.82;

      // Scale — proportional to cell size
      // 0.18 is calibrated for cellWidth=135. Scale proportionally for other sizes.
      const baseScale = 0.18;
      const scaleFactor = cellWidth / 135;
      spine.scale.set(baseScale * scaleFactor);

      spine.position.set(x, y);
      spine.autoUpdate = false;

      // Set skin
      try {
        spine.skeleton.setSkinByName('default');
        spine.skeleton.setSlotsToSetupPose();
      } catch { /* ignore */ }

      // Start idle animation
      const animName = hero.animation || getIdleAnimation(hero.heroTemplateId);
      const availableAnims = spine.skeleton.data.animations.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => a.name
      );
      const resolved = resolveAnimation(availableAnims, animName);

      try {
        spine.state.setAnimation(0, resolved, true);
      } catch {
        if (availableAnims.length > 0) {
          try { spine.state.setAnimation(0, availableAnims[0], true); } catch { /* */ }
        }
      }

      gridContainer.addChild(spine);
      spinesRef.current.push(spine);
    });

    // Start the ticker with safe update
    const safeUpdate = () => {
      const dt = 1 / 30;
      spinesRef.current.forEach((spine) => {
        if (!spine) return;
        try {
          spine.update(dt);
        } catch { /* MeshAttachment errors */ }
      });
    };

    app.ticker.add(safeUpdate);
    app.start();

    return () => {
      const currentApp = appRef.current;
      if (currentApp) {
        try {
          currentApp.ticker.remove(safeUpdate);
          currentApp.stop();
        } catch { /* app may already be destroyed */ }
      }
    };
  }, [ready, heroes, columns, cellWidth, cellHeight, gap]);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
