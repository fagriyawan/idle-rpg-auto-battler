import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlayerData } from '../context/PlayerDataContext';
import SpineRenderer from './SpineRenderer';
import HeroesGridCanvas from './HeroesGridCanvas';
import { getSpineAssets, getClassIcon } from '../utils/hero-display';
import type { FormationPosition, HeroDetail } from '../types/player-data';
import styles from './FormationPanel.module.css';

const MAX_FORMATION_SIZE = 5;

/** Default spawn positions when deploying heroes */
const DEFAULT_POSITIONS: { x: number; y: number }[] = [
  { x: 50, y: 50 },
  { x: 30, y: 40 },
  { x: 70, y: 40 },
  { x: 30, y: 70 },
  { x: 70, y: 70 },
];

interface FormationPanelProps {
  onClose: () => void;
}

/**
 * Validates formation constraints client-side before sending to server.
 * Returns an error message if invalid, or null if valid.
 */
function validateFormation(heroIds: string[]): string | null {
  if (heroIds.length === 0) {
    return 'Formation must contain at least 1 hero.';
  }
  if (heroIds.length > MAX_FORMATION_SIZE) {
    return `Formation cannot exceed ${MAX_FORMATION_SIZE} heroes.`;
  }
  const unique = new Set(heroIds);
  if (unique.size !== heroIds.length) {
    return 'Formation cannot contain duplicate heroes.';
  }
  return null;
}

export default function FormationPanel({ onClose }: FormationPanelProps) {
  const { formation, formationPositions, heroes, saveFormation } = usePlayerData();

  const [positions, setPositions] = useState<FormationPosition[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ heroId: string; offsetX: number; offsetY: number } | null>(null);

  const battlefieldRef = useRef<HTMLDivElement>(null);

  // Load the current formation from context on mount
  useEffect(() => {
    if (formationPositions && formationPositions.length > 0) {
      setPositions(formationPositions);
    } else if (formation.length > 0) {
      // Backward compat: place heroes at default positions
      const initialPositions: FormationPosition[] = formation.map((heroId, idx) => ({
        heroId,
        x: DEFAULT_POSITIONS[idx]?.x ?? 50,
        y: DEFAULT_POSITIONS[idx]?.y ?? 50,
      }));
      setPositions(initialPositions);
    }
  }, [formation, formationPositions]);

  const deployedHeroIds = positions.map((p) => p.heroId);
  const deployedSet = new Set(deployedHeroIds);
  const deployedCount = deployedHeroIds.length;

  // Sort heroes: deployed first, then the rest
  const sortedHeroes = [...heroes].sort((a, b) => {
    const aDeployed = deployedSet.has(a.id) ? 0 : 1;
    const bDeployed = deployedSet.has(b.id) ? 0 : 1;
    return aDeployed - bDeployed;
  });

  const getHero = useCallback(
    (heroId: string): HeroDetail | undefined => {
      return heroes.find((h) => h.id === heroId);
    },
    [heroes]
  );

  // Deploy or remove a hero
  const deployHero = (heroId: string) => {
    setError(null);
    setSuccessMsg(null);

    if (deployedSet.has(heroId)) {
      // Remove from battlefield
      setPositions((prev) => prev.filter((p) => p.heroId !== heroId));
      return;
    }

    if (deployedCount >= MAX_FORMATION_SIZE) {
      setError(`Formation is full (max ${MAX_FORMATION_SIZE} heroes).`);
      return;
    }

    // Find the next default position
    const posIndex = deployedCount;
    const defaultPos = DEFAULT_POSITIONS[posIndex] ?? { x: 50, y: 50 };

    setPositions((prev) => [...prev, { heroId, x: defaultPos.x, y: defaultPos.y }]);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent, heroId: string) => {
    e.preventDefault();
    const heroEl = e.currentTarget as HTMLElement;
    const offsetX = e.clientX - heroEl.getBoundingClientRect().left;
    const offsetY = e.clientY - heroEl.getBoundingClientRect().top;
    setDragging({ heroId, offsetX, offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !battlefieldRef.current) return;
    const rect = battlefieldRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left - dragging.offsetX + 40) / rect.width) * 100;
    let y = ((e.clientY - rect.top - dragging.offsetY + 40) / rect.height) * 100;
    // Clamp to bounds
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    setPositions((prev) =>
      prev.map((p) => (p.heroId === dragging.heroId ? { ...p, x, y } : p))
    );
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleMouseLeave = () => {
    setDragging(null);
  };

  const handleSave = async () => {
    setError(null);
    setSuccessMsg(null);

    const heroIds = positions.map((p) => p.heroId);

    const validationError = validateFormation(heroIds);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      await saveFormation(heroIds, positions);
      setSuccessMsg('Formation saved successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save formation';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if there are changes from the saved state
  const hasChanges =
    JSON.stringify(positions) !== JSON.stringify(formationPositions ?? []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>🛡️ Formation</span>
          <span className={styles.formationCount}>
            {deployedCount}/{MAX_FORMATION_SIZE} Deployed
          </span>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Error / Success Messages */}
        {error && <div className={styles.error}>{error}</div>}
        {successMsg && <div className={styles.success}>{successMsg}</div>}

        {/* Main Content: Battlefield + Hero Collection */}
        <div className={styles.content}>
          {/* Left: Free-form Battlefield */}
          <div className={styles.battlefieldSection}>
            <div className={styles.sectionLabel}>Battlefield</div>
            <div
              ref={battlefieldRef}
              className={styles.battlefield}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {positions.map((pos) => {
                const hero = getHero(pos.heroId);
                if (!hero) return null;
                const spineAssets = getSpineAssets(hero.heroTemplateId);

                return (
                  <div
                    key={pos.heroId}
                    className={styles.battlefieldHero}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    onMouseDown={(e) => handleMouseDown(e, pos.heroId)}
                  >
                    <SpineRenderer
                      jsonUrl={spineAssets.jsonUrl}
                      skelUrl={spineAssets.skelUrl}
                      atlasUrl={spineAssets.atlasUrl}
                      animation={spineAssets.animation || 'Idle'}
                      width={80}
                      height={80}
                    />
                    <span className={styles.heroNameLabel}>{hero.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Hero Collection */}
          <div className={styles.collectionSection}>
            <div className={styles.sectionLabel}>Heroes</div>
            <div className={styles.heroGrid}>
              {/* Shared canvas for all hero spine animations */}
              <div className={styles.heroGridInner}>
                <HeroesGridCanvas
                  heroes={sortedHeroes.map((hero) => ({
                    heroTemplateId: hero.heroTemplateId,
                    animation: getSpineAssets(hero.heroTemplateId).animation,
                  }))}
                  columns={4}
                  cellWidth={100}
                  cellHeight={120}
                  gap={8}
                />
                {/* HTML overlay cards */}
                <div className={styles.heroGridCards}>
                  {sortedHeroes.map((hero) => {
                    const isDeployed = deployedSet.has(hero.id);
                    const classIcon = getClassIcon(hero.classType);

                    return (
                      <div
                        key={hero.id}
                        className={`${styles.heroCard} ${isDeployed ? styles.heroCardDeployed : ''}`}
                        onClick={() => deployHero(hero.id)}
                      >
                        {/* Deployed overlay */}
                        {isDeployed && (
                          <div className={styles.deployedOverlay}>
                            <span className={styles.deployedBadge}>DEPLOYED</span>
                          </div>
                        )}

                        {/* Level badge - top left */}
                        <div className={styles.levelBadge}>{hero.level}</div>

                        {/* Name - top center */}
                        <div className={styles.heroCardName}>{hero.name}</div>

                        {/* Class icon - top right */}
                        <div className={styles.classIcon}>{classIcon}</div>

                        {/* Transparent area for spine */}
                        <div className={styles.heroCardSpine} />

                        {/* Stars - bottom */}
                        <div className={styles.heroCardStars}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <span
                              key={i}
                              className={i < hero.stars ? styles.starFilled : styles.starEmpty}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={`${styles.saveBtn} ${isSaving ? styles.saveBtnSaving : ''}`}
            onClick={handleSave}
            disabled={isSaving || !hasChanges || deployedCount === 0}
          >
            {isSaving ? 'Saving...' : 'Save Formation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { validateFormation };
