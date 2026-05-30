import { useEffect, useState, useCallback } from 'react';
import { preloadAllSpineAssets, type PreloadProgress } from '../utils/spine-asset-cache';
import { getAllHeroTemplateIds } from '../utils/asset-preloader';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  onComplete: () => void;
}

const TIPS = [
  'Assembling your heroes...',
  'Sharpening swords and staves...',
  'Preparing the battlefield...',
  'Loading spine animations...',
  'Summoning warriors from the void...',
];

/**
 * Full-screen loading screen shown after login.
 * Preloads all spine assets (JSON + atlas + textures) with a progress bar.
 * Once complete, calls onComplete to transition to the dashboard.
 */
export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState<PreloadProgress>({ loaded: 0, total: 1, currentHero: '' });
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  const handleProgress = useCallback((p: PreloadProgress) => {
    setProgress(p);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      const heroIds = getAllHeroTemplateIds();
      setProgress({ loaded: 0, total: heroIds.length, currentHero: '' });

      await preloadAllSpineAssets(heroIds, handleProgress);

      // Small delay for visual polish before transitioning
      if (!cancelled) {
        setTimeout(() => {
          if (!cancelled) onComplete();
        }, 400);
      }
    }

    loadAssets();

    return () => { cancelled = true; };
  }, [onComplete, handleProgress]);

  const percent = progress.total > 0
    ? Math.round((progress.loaded / progress.total) * 100)
    : 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.spinner} />
        <h1 className={styles.title}>Loading Assets</h1>
        <p className={styles.subtitle}>{tip}</p>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className={styles.progressText}>
            <span className={styles.progressLabel}>
              {progress.loaded}/{progress.total} heroes
            </span>
            <span className={styles.progressPercent}>{percent}%</span>
          </div>
        </div>

        <p className={styles.tip}>
          First load may take a moment. Assets are cached for future sessions.
        </p>
      </div>
    </div>
  );
}
