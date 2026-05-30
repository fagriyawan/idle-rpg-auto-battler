import { useRef, useState, useCallback, useEffect } from 'react';
import { usePlayerData } from '../context/PlayerDataContext';
import { getClassIcon, getSpineAssets } from '../utils/hero-display';
import HeroesGridCanvas from './HeroesGridCanvas';
import styles from './HeroesPanel.module.css';

interface HeroesPanelProps {
  onClose: () => void;
  onHeroSelect?: (index: number) => void;
}

/** Grid layout constants */
const CELL_WIDTH = 135;
const CELL_HEIGHT = 200;
const GRID_GAP = 12;

export default function HeroesPanel({ onClose, onHeroSelect }: HeroesPanelProps) {
  const { heroes, formation, isLoading } = usePlayerData();
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(5);

  // Derive active status from current formation
  const formationSet = new Set(formation);

  // Sort heroes: active (in formation) first, then the rest
  const sortedHeroes = [...heroes].sort((a, b) => {
    const aActive = formationSet.has(a.id) ? 0 : 1;
    const bActive = formationSet.has(b.id) ? 0 : 1;
    return aActive - bActive;
  });

  // Calculate grid columns based on container width
  const updateDimensions = useCallback(() => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const cols = Math.max(1, Math.floor(rect.width / (CELL_WIDTH + GRID_GAP)));
    setColumns(cols);
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // Also update when heroes load
  useEffect(() => {
    updateDimensions();
  }, [heroes.length, updateDimensions]);

  // Prepare hero data for the canvas
  const heroGridItems = sortedHeroes.map((hero) => {
    const spineAssets = getSpineAssets(hero.heroTemplateId);
    return {
      heroTemplateId: hero.heroTemplateId,
      animation: spineAssets.animation,
    };
  });

  const rows = Math.ceil(sortedHeroes.length / columns);
  const totalGridHeight = rows * CELL_HEIGHT + Math.max(0, rows - 1) * GRID_GAP;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.filters}>
            <button className={styles.filterBtn}>Level ▼</button>
            <button className={styles.filterBtn}>Stars ▼</button>
            <button className={styles.filterBtn}>Class ▼</button>
          </div>
          <div className={styles.heroCount}>
            Heroes <span className={styles.countValue}>{heroes.length}/{heroes.length}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Hero Grid with shared canvas */}
        <div ref={gridRef} className={styles.gridContainer}>
          {isLoading && heroes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
              Loading heroes...
            </div>
          ) : heroes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
              No heroes found
            </div>
          ) : (
            <div
              className={styles.gridInner}
              style={{ height: `${totalGridHeight}px` }}
            >
              {/* Shared PixiJS canvas — full height, scrolls with container */}
              <HeroesGridCanvas
                heroes={heroGridItems}
                columns={columns}
                cellWidth={CELL_WIDTH}
                cellHeight={CELL_HEIGHT}
                gap={GRID_GAP}
              />

              {/* HTML overlay cards for UI elements (clickable, badges, stars) */}
              <div
                className={styles.grid}
                style={{
                  gridTemplateColumns: `repeat(${columns}, ${CELL_WIDTH}px)`,
                  gap: `${GRID_GAP}px`,
                }}
              >
                {sortedHeroes.map((hero) => {
                  const classIcon = getClassIcon(hero.classType);

                  return (
                    <div
                      key={hero.id}
                      className={styles.heroCard}
                      style={{ height: `${CELL_HEIGHT}px` }}
                      onClick={() => onHeroSelect?.(heroes.indexOf(hero))}
                    >
                      {/* Level badge */}
                      <div className={styles.levelBadge}>{hero.level}</div>

                      {/* Name */}
                      <div className={styles.heroName}>{hero.name}</div>

                      {/* Class icon */}
                      <div className={styles.classIcon}>{classIcon}</div>

                      {/* Transparent character area — spine renders behind via canvas */}
                      <div className={styles.characterArea} />

                      {/* Active badge */}
                      {formationSet.has(hero.id) && (
                        <div className={styles.activeBadge}>ACTIVE</div>
                      )}

                      {/* Stars */}
                      <div className={styles.stars}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={i < hero.stars ? styles.starFilled : styles.starEmpty}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
