import type { HeroDetail } from '../../types/hero-detail';
import styles from './PotentialTab.module.css';

interface PotentialTabProps {
  hero: HeroDetail;
}

export default function PotentialTab({ hero }: PotentialTabProps) {
  const attackSkill = hero.skills[0];
  const skill = hero.skills[1];

  return (
    <div className={styles.potentialTab}>
      {/* Attack Skill Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Attack Skill</h3>
        {attackSkill ? (
          <div className={styles.skillRow}>
            <span className={styles.skillIcon}>{attackSkill.icon}</span>
            <div className={styles.skillInfo}>
              <span className={styles.skillName}>{attackSkill.name}</span>
              <span className={styles.skillLevel}>Lv.{attackSkill.level}</span>
            </div>
            <button className={styles.upgradeButton} onClick={() => {}}>
              Upgrade
            </button>
          </div>
        ) : (
          <p className={styles.noSkillData}>No attack skill data</p>
        )}
      </div>

      {/* Skill Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Skill</h3>
        {skill ? (
          <div className={styles.skillRow}>
            <span className={styles.skillIcon}>{skill.icon}</span>
            <div className={styles.skillInfo}>
              <span className={styles.skillName}>{skill.name}</span>
              <span className={styles.skillLevel}>Lv.{skill.level}</span>
            </div>
            <button className={styles.upgradeButton} onClick={() => {}}>
              Upgrade
            </button>
          </div>
        ) : (
          <p className={styles.noSkillData}>No skill data</p>
        )}
      </div>
    </div>
  );
}
