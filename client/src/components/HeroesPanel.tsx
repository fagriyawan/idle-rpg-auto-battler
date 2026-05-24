import SpineRenderer from './SpineRenderer';
import styles from './HeroesPanel.module.css';

interface Hero {
  id: string;
  name: string;
  level: number;
  stars: number;
  classType: string;
  classIcon: string;
  spine: {
    jsonUrl?: string;
    skelUrl?: string;
    atlasUrl: string;
    animation?: string;
  };
  active: boolean;
}

const DUMMY_HEROES: Hero[] = [
  {
    id: '1', name: 'Elise', level: 30, stars: 2, classType: 'Warrior', classIcon: '⚔️',
    spine: { jsonUrl: '/assets/heroes/character_spine3875/001/action.json', atlasUrl: '/assets/heroes/character_spine3875/001/action.atlas' },
    active: true,
  },
  {
    id: '2', name: 'Ray', level: 26, stars: 3, classType: 'Mage', classIcon: '🔮',
    spine: { jsonUrl: '/assets/heroes/character_spine3875/002/action.json', atlasUrl: '/assets/heroes/character_spine3875/002/action.atlas' },
    active: true,
  },
  {
    id: '3', name: 'Rika', level: 25, stars: 4, classType: 'Archer', classIcon: '🏹',
    spine: { jsonUrl: '/assets/heroes/character_spine3875/003/H30058.json', atlasUrl: '/assets/heroes/character_spine3875/003/H30058.atlas' },
    active: true,
  },
  {
    id: '4', name: 'Nami', level: 25, stars: 3, classType: 'Healer', classIcon: '💚',
    spine: { jsonUrl: '/assets/heroes/character_spine3875/004/H30107.json', atlasUrl: '/assets/heroes/character_spine3875/004/H30107.atlas' },
    active: true,
  },
];

interface HeroesPanelProps {
  onClose: () => void;
}

export default function HeroesPanel({ onClose }: HeroesPanelProps) {
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
            Heroes <span className={styles.countValue}>{DUMMY_HEROES.length}/{DUMMY_HEROES.length}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Hero Grid */}
        <div className={styles.grid}>
          {DUMMY_HEROES.map((hero) => (
            <div key={hero.id} className={styles.heroCard}>
              {/* Level badge */}
              <div className={styles.levelBadge}>{hero.level}</div>

              {/* Name */}
              <div className={styles.heroName}>{hero.name}</div>

              {/* Class icon */}
              <div className={styles.classIcon}>{hero.classIcon}</div>

              {/* Character - Spine Animation */}
              <div className={styles.characterArea}>
                <SpineRenderer
                  jsonUrl={hero.spine.jsonUrl}
                  skelUrl={hero.spine.skelUrl}
                  atlasUrl={hero.spine.atlasUrl}
                  animation={hero.spine.animation || 'Idle'}
                  width={120}
                  height={140}
                />
              </div>

              {/* Active badge */}
              {hero.active && (
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
          ))}
        </div>
      </div>
    </div>
  );
}
