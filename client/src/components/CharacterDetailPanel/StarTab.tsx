import type { HeroDetail } from '../../types/hero-detail';
import styles from './StarTab.module.css';

interface StarTabProps {
  hero: HeroDetail;
}

export default function StarTab({ hero }: StarTabProps) {
  const maxStars = 5;
  const currentStars = Math.max(0, Math.min(hero.stars, maxStars));
  const nextStars = Math.min(currentStars + 1, maxStars);
  const isMaxed = currentStars >= maxStars;

  return (
    <div className={styles.starTab}>
      {/* Current Star Rating */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Current Star Rating</h3>
        <div className={styles.starDisplay}>
          {Array.from({ length: currentStars }, (_, i) => (
            <span key={`current-filled-${i}`} className={styles.starFilled}>★</span>
          ))}
          {Array.from({ length: maxStars - currentStars }, (_, i) => (
            <span key={`current-empty-${i}`} className={styles.starEmpty}>☆</span>
          ))}
        </div>
        <p className={styles.starLabel}>{currentStars} / {maxStars} Stars</p>
      </div>

      {/* Next Star Level Indicator */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Next Star Level</h3>
        {isMaxed ? (
          <p className={styles.maxedText}>Maximum star level reached!</p>
        ) : (
          <>
            <div className={styles.starDisplay}>
              {Array.from({ length: currentStars }, (_, i) => (
                <span key={`next-filled-${i}`} className={styles.starFilled}>★</span>
              ))}
              <span className={styles.starNext}>★</span>
              {Array.from({ length: maxStars - nextStars }, (_, i) => (
                <span key={`next-empty-${i}`} className={styles.starEmpty}>☆</span>
              ))}
            </div>
            <p className={styles.starLabel}>{nextStars} / {maxStars} Stars</p>
          </>
        )}
      </div>

      {/* Star Upgrade Button */}
      <div className={styles.section}>
        <button
          className={styles.starUpButton}
          onClick={() => {}}
          disabled={isMaxed}
        >
          {isMaxed ? 'Max Stars' : '⭐ Star Up'}
        </button>
      </div>
    </div>
  );
}
