import SpineCharacter from './SpineCharacter';
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
    spine: { jsonUrl: '/assets/heroes/001/cream_arcade_000.json', atlasUrl: '/assets/heroes/001/cream_arcade_000.atlas' },
    active: true,
  },
  {
    id: '2', name: 'Ray', level: 26, stars: 3, classType: 'Mage', classIcon: '🔮',
    spine: { skelUrl: '/assets/heroes/003/L05001.skel', atlasUrl: '/assets/heroes/003/L05001.atlas' },
    active: true,
  },
  {
    id: '3', name: 'Rika', level: 25, stars: 4, classType: 'Archer', classIcon: '🏹',
    spine: { skelUrl: '/assets/heroes/004/H30103.skel', atlasUrl: '/assets/heroes/004/H30103.atlas' },
    active: true,
  },
  {
    id: '4', name: 'Nami', level: 25, stars: 3, classType: 'Healer', classIcon: '💚',
    spine: { skelUrl: '/assets/heroes/005/crew110016.skel', atlasUrl: '/assets/heroes/005/crew110016.atlas' },
    active: true,
  },
  {
    id: '5', name: 'Kamos', level: 25, stars: 5, classType: 'Tank', classIcon: '🛡️',
    spine: { skelUrl: '/assets/heroes/006/crew110026.skel', atlasUrl: '/assets/heroes/006/crew110026.atlas' },
    active: true,
  },
  {
    id: '6', name: 'Lina', level: 22, stars: 2, classType: 'Mage', classIcon: '🔮',
    spine: { skelUrl: '/assets/heroes/007/crew130004.skel', atlasUrl: '/assets/heroes/007/crew130004.atlas' },
    active: false,
  },
  {
    id: '7', name: 'Jugg', level: 20, stars: 1, classType: 'Warrior', classIcon: '⚔️',
    spine: { jsonUrl: '/assets/heroes/001/cream_arcade_000.json', atlasUrl: '/assets/heroes/001/cream_arcade_000.atlas' },
    active: false,
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
                <SpineCharacter
                  jsonUrl={hero.spine.jsonUrl}
                  skelUrl={hero.spine.skelUrl}
                  atlasUrl={hero.spine.atlasUrl}
                  animation={hero.spine.animation || 'Idle'}
                  width={100}
                  height={100}
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
