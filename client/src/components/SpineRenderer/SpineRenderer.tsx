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

  const config = useMemo<SpineAssetConfig | null>(() => {
    if (!atlasUrl || (!jsonUrl && !skelUrl)) return null;
    return { jsonUrl, skelUrl, atlasUrl, animation };
  }, [jsonUrl, skelUrl, atlasUrl, animation]);

  const loadingState: LoadingState = useSpineLoader(app, config);

  // Scale and center the spine character when it's ready
  useEffect(() => {
    if (loadingState.status !== 'ready' || !loadingState.spine || !app) return;

    const spine = loadingState.spine;

    // Use skeleton dimensions from data for scaling
    const skeletonData = spine.skeleton.data;
    const skelWidth = skeletonData.width || 100;
    const skelHeight = skeletonData.height || 100;

    if (skelWidth > 0 && skelHeight > 0) {
      const scaleX = width / skelWidth;
      const scaleY = height / skelHeight;
      const scale = Math.min(scaleX, scaleY) * 0.85; // Slightly smaller to fit full body
      spine.scale.set(scale);
    } else {
      spine.scale.set(0.3);
    }

    // Position: character origin is at feet, so place lower in canvas
    // This pushes the character down so head doesn't get clipped at top
    spine.position.set(width / 2, height * 0.95);
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
