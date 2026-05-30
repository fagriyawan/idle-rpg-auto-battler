import { useState } from 'react';
import type { HeroDetail, TabId } from '../../types/hero-detail';
import { getNextHeroIndex, getPreviousHeroIndex } from '../../utils/character-switcher';
import SpineRenderer from '../SpineRenderer/SpineRenderer';
import InfoTab from './InfoTab';
import PotentialTab from './PotentialTab';
import StarTab from './StarTab';
import styles from './CharacterDetailPanel.module.css';

interface CharacterDetailPanelProps {
  heroes: HeroDetail[];
  initialHeroIndex: number;
  onClose: () => void;
}

function StarRating({ stars }: { stars: number }) {
  const maxStars = 5;
  const filled = Math.max(0, Math.min(stars, maxStars));
  const empty = maxStars - filled;

  return (
    <div className={styles.starRating}>
      {Array.from({ length: filled }, (_, i) => (
        <span key={`filled-${i}`} className={styles.starFilled}>★</span>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`empty-${i}`} className={styles.starEmpty}>☆</span>
      ))}
    </div>
  );
}

export default function CharacterDetailPanel({
  heroes,
  initialHeroIndex,
  onClose,
}: CharacterDetailPanelProps) {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(
    Math.max(0, Math.min(initialHeroIndex, heroes.length - 1))
  );
  const [activeTab, setActiveTab] = useState<TabId>('info');

  const currentHero = heroes[currentHeroIndex];

  if (!currentHero) {
    return (
      <div className={styles.overlay}>
        <button className={styles.backButton} onClick={onClose}>
          ← Back
        </button>
        <div className={styles.container}>
          <p style={{ color: '#a0c4f0', textAlign: 'center', width: '100%' }}>
            Hero not found
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'info', label: 'Info' },
    { id: 'star', label: 'Star' },
    { id: 'potential', label: 'Potential' },
  ];

  const handlePrevious = () => {
    setCurrentHeroIndex(getPreviousHeroIndex(currentHeroIndex, heroes.length));
  };

  const handleNext = () => {
    setCurrentHeroIndex(getNextHeroIndex(currentHeroIndex, heroes.length));
  };

  return (
    <div className={styles.overlay}>
      {/* Back Button */}
      <button className={styles.backButton} onClick={onClose}>
        ← Back
      </button>

      <div className={styles.container}>
        {/* Left Column — Character Display */}
        <div className={styles.leftColumn}>
          <button
            className={styles.arrowButton}
            onClick={handlePrevious}
            aria-label="Previous hero"
          >
            ‹
          </button>
          <div className={styles.characterDisplay}>
            <h2 className={styles.heroName}>{currentHero.name}</h2>
            <StarRating stars={currentHero.stars} />
            <div className={styles.spineContainer}>
              <SpineRenderer
                key={currentHero.id}
                jsonUrl={currentHero.spine.jsonUrl}
                skelUrl={currentHero.spine.skelUrl}
                atlasUrl={currentHero.spine.atlasUrl}
                animation={currentHero.spine.animation}
                width={200}
                height={280}
              />
            </div>
            <button className={styles.levelUpButton} onClick={() => {}}>
              Level Up
            </button>
          </div>
          <button
            className={styles.arrowButton}
            onClick={handleNext}
            aria-label="Next hero"
          >
            ›
          </button>
        </div>

        {/* Right Column — Tab Content */}
        <div className={styles.rightColumn}>
          <div className={styles.tabNav}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={styles.tabContent}>
            {activeTab === 'info' && <InfoTab hero={currentHero} />}
            {activeTab === 'star' && <StarTab hero={currentHero} />}
            {activeTab === 'potential' && <PotentialTab hero={currentHero} />}
          </div>
        </div>
      </div>
    </div>
  );
}
