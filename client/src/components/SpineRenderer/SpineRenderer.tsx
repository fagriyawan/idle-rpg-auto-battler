import { useRef, useMemo, useEffect } from 'react';
import { usePixiApp } from '../../hooks/usePixiApp';
import { useSpineLoader, type LoadingState } from '../../hooks/useSpineLoader';
import type { SpineAssetConfig } from '../../utils/spine/spine-asset-loader';
import styles from './SpineRenderer.module.css';

export interface SpineRendererProps {
  jsonUrl?: string;
  skelUrl?: string;
  atlasUrl: string;
  animation?: string;
  width?: number;
  height?: number;
}

export default function SpineRenderer({
  jsonUrl,
  skelUrl,
  atlasUrl,
  animation,
  width = 120,
  height = 120,
}: SpineRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const app = usePixiApp(containerRef, width, height);

  // Config for loading — only depends on asset URLs, NOT animation
  const config = useMemo<SpineAssetConfig | null>(() => {
    if (!atlasUrl || (!jsonUrl && !skelUrl)) return null;
    return { jsonUrl, skelUrl, atlasUrl, animation };
  }, [jsonUrl, skelUrl, atlasUrl, animation]);

  const loadingState: LoadingState = useSpineLoader(app, config);

  // Switch animation dynamically when prop changes (without reloading spine)
  const lastAnimRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (loadingState.status !== 'ready') return;
    if (!animation) return;
    if (animation === lastAnimRef.current) return;

    const spine = loadingState.spine;
    if (!spine.state || !spine.skeleton) return;

    lastAnimRef.current = animation;

    try {
      // Use non-looping for attack/skill/die, looping for idle/run
      const isOneShot = animation.includes('attack') || animation.includes('skill') || animation.includes('die');
      spine.state.setAnimation(0, animation, !isOneShot);

      // For one-shot animations (attack/skill), queue idle after completion
      if (isOneShot && !animation.includes('die')) {
        const anims = spine.skeleton.data.animations.map((a: { name: string }) => a.name);
        const idleAnim = anims.find((n: string) => n.includes('idle') && !n.includes('noWeapon'));
        if (idleAnim) {
          spine.state.addAnimation(0, idleAnim, true, 0);
        }
      }
    } catch {
      // Animation not found — ignore
    }
  }, [animation, loadingState]);

  // Scale and center the spine character when it's ready
  useEffect(() => {
    if (loadingState.status !== 'ready' || !loadingState.spine || !app) return;

    const spine = loadingState.spine;
    if (!spine.skeleton) return;

    // Scale character to fill the canvas
    const skeletonData = spine.skeleton.data;
    const skelWidth = skeletonData.width || 200;
    const skelHeight = skeletonData.height || 200;

    // For large skeletons (>500px), use aggressive scaling
    // For small skeletons, use the original formula
    if (skelWidth > 500 || skelHeight > 500) {
      // Large skeleton — scale to fill ~60% of canvas
      const scale = Math.min(width, height) / Math.max(skelWidth, skelHeight) * 3.5;
      spine.scale.set(scale);
    } else if (skelWidth > 0 && skelHeight > 0) {
      const scaleX = width / skelWidth;
      const scaleY = height / skelHeight;
      const scale = Math.min(scaleX, scaleY) * 0.85;
      spine.scale.set(scale);
    } else {
      spine.scale.set(0.3);
    }

    // Position: character origin is at feet, so place lower in canvas
    spine.position.set(width / 2, height * 0.85);
  }, [loadingState, app, width, height]);

  useEffect(() => {
    if (loadingState.status === 'error') {
      console.warn(
        `[SpineRenderer] Failed to load spine asset:`,
        loadingState.error.message,
        loadingState.error.url ? `(${loadingState.error.url})` : ''
      );
    }
  }, [loadingState]);

  // Pause/resume ticker based on visibility (IntersectionObserver)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !app) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          app.ticker.start();
        } else {
          app.ticker.stop();
        }
      },
      { threshold: 0.1 } // Trigger when at least 10% visible
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [app]);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
      }}
    >
      {loadingState.status === 'loading' && (
        <div className={styles.loadingPlaceholder}>
          <span className={`spine-renderer-loading ${styles.loadingIcon}`}>
            ⏳
          </span>
        </div>
      )}
      {loadingState.status === 'error' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '8px',
          }}
        >
          <span style={{ fontSize: '2rem', opacity: 0.4 }}>🧙</span>
        </div>
      )}
    </div>
  );
}
