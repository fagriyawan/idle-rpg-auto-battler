import type { HeroDetail, HeroRune } from '../../types/hero-detail';
import styles from './InfoTab.module.css';

/** Pad runes array to exactly 4 slots, filling with null if shorter */
function padRunes(runes: (HeroRune | null)[]): (HeroRune | null)[] {
  const padded = [...runes];
  while (padded.length < 4) {
    padded.push(null);
  }
  return padded.slice(0, 4);
}

interface InfoTabProps {
  hero: HeroDetail;
}

export default function InfoTab({ hero }: InfoTabProps) {
  const attackSkill = hero.skills[0];
  const skill = hero.skills[1];
  const runeSlots = padRunes(hero.runes);

  return (
    <div className={styles.infoTab}>
      {/* Attributes Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Attributes</h3>
        <div className={styles.attributesList}>
          <div className={styles.attributeRow}>
            <span className={styles.attributeIcon}>⚔️</span>
            <span className={styles.attributeLabel}>Attack</span>
            <span className={styles.attributeValue}>{hero.attributes.attack}</span>
          </div>
          <div className={styles.attributeRow}>
            <span className={styles.attributeIcon}>🛡️</span>
            <span className={styles.attributeLabel}>Armor</span>
            <span className={styles.attributeValue}>{hero.attributes.armor}</span>
          </div>
          <div className={styles.attributeRow}>
            <span className={styles.attributeIcon}>❤️</span>
            <span className={styles.attributeLabel}>HP</span>
            <span className={styles.attributeValue}>{hero.attributes.hp}</span>
          </div>
        </div>
      </div>

      {/* Attack Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Attack</h3>
        {attackSkill ? (
          <div className={styles.skillDisplay}>
            <div className={styles.skillHeader}>
              <span className={styles.skillIcon}>{attackSkill.icon}</span>
              <div className={styles.skillNameRow}>
                <span className={styles.skillName}>{attackSkill.name}</span>
                <span className={styles.skillLevel}>Lv.{attackSkill.level}</span>
              </div>
            </div>
            <p className={styles.skillDescription}>{attackSkill.description}</p>
          </div>
        ) : (
          <p className={styles.noSkillData}>No skill data</p>
        )}
      </div>

      {/* Skill Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Skill</h3>
        {skill ? (
          <div className={styles.skillDisplay}>
            <div className={styles.skillHeader}>
              <span className={styles.skillIcon}>{skill.icon}</span>
              <div className={styles.skillNameRow}>
                <span className={styles.skillName}>{skill.name}</span>
                <span className={styles.skillLevel}>Lv.{skill.level}</span>
              </div>
            </div>
            <p className={styles.skillDescription}>{skill.description}</p>
          </div>
        ) : (
          <p className={styles.noSkillData}>No skill data</p>
        )}
      </div>

      {/* Runes Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Runes</h3>
        <div className={styles.runeGrid}>
          {runeSlots.map((rune, index) => (
            <div key={rune?.id ?? `empty-${index}`} className={styles.runeSlot}>
              {rune ? (
                <>
                  <span className={styles.runeIcon}>{rune.icon}</span>
                  <span className={styles.runeLevel}>+{rune.level}</span>
                </>
              ) : (
                <span className={styles.runePlaceholder}>◇</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
