import { useCallback, useEffect, useState } from 'react';
import { usePlayerData } from '../context/PlayerDataContext';
import * as campaignApi from '../services/campaign-api';
import type { CampaignChapter, CampaignStageWithProgress } from '../types/campaign';
import styles from './CampaignPanel.module.css';

interface CampaignPanelProps {
  onClose: () => void;
  onStartBattle?: (stageId: string, difficulty: string) => void;
}

export default function CampaignPanel({ onClose, onStartBattle }: CampaignPanelProps) {
  const { fetchProfile, resources } = usePlayerData();
  const [chapter, setChapter] = useState<CampaignChapter | null>(null);
  const [stages, setStages] = useState<CampaignStageWithProgress[]>([]);
  const [selectedStage, setSelectedStage] = useState<CampaignStageWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [victory, setVictory] = useState<{ stars: number; stageTitle: string } | null>(null);
  const [clearing, setClearing] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'hard' | 'nightmare'>('easy');
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<string[]>(['easy']);

  const token = localStorage.getItem('idle_rpg_token') || '';

  const loadChapter = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await campaignApi.getChapterWithStages(token, 'chapter_1');
      setChapter(data.chapter);
      setStages(data.stages);
      if (data.unlockedDifficulties) {
        setUnlockedDifficulties(data.unlockedDifficulties);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load campaign');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  const handleStageClick = (stage: CampaignStageWithProgress) => {
    if (!stage.unlocked) return;
    setSelectedStage(stage);
  };

  const handleStartBattle = async () => {
    if (!selectedStage || !selectedStage.unlocked || clearing) return;

    // If onStartBattle prop is provided, navigate to battle page
    if (onStartBattle) {
      onStartBattle(selectedStage.id, difficulty);
      return;
    }

    setClearing(true);
    try {
      // Fallback: auto-clear with 3 stars (legacy behavior)
      await campaignApi.recordStageClear(token, selectedStage.id, 3);
      setVictory({ stars: 3, stageTitle: selectedStage.title });

      // Refresh campaign data and player profile
      await loadChapter();
      await fetchProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to clear stage');
    } finally {
      setClearing(false);
    }
  };

  const handleVictoryClose = () => {
    setVictory(null);
    // Select the next stage if available
    if (selectedStage) {
      const nextStage = stages.find(
        (s) => s.stageNumber === selectedStage.stageNumber + 1
      );
      if (nextStage && nextStage.unlocked) {
        setSelectedStage(nextStage);
      } else {
        // Re-select current stage to show updated progress
        const updated = stages.find((s) => s.id === selectedStage.id);
        setSelectedStage(updated || null);
      }
    }
  };

  const getNodeClass = (stage: CampaignStageWithProgress): string => {
    const classes = [styles.stageNodeInner];
    if (!stage.unlocked) {
      classes.push(styles.stageNodeLocked);
    } else if (stage.progress && stage.progress.stars > 0) {
      classes.push(styles.stageNodeCleared);
    } else {
      // First unlocked but uncleared stage = "current"
      const isCurrentStage = stages.find(
        (s) => s.unlocked && (!s.progress || s.progress.stars === 0)
      );
      if (isCurrentStage?.id === stage.id) {
        classes.push(styles.stageNodeCurrent);
      } else {
        classes.push(styles.stageNodeUnlocked);
      }
    }
    if (selectedStage?.id === stage.id) {
      classes.push(styles.stageNodeSelected);
    }
    return classes.join(' ');
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <span key={i} className={i < count ? styles.starFilled : styles.starEmpty}>
        ★
      </span>
    ));
  };

  // Generate SVG path lines between consecutive stages
  const renderPaths = () => {
    if (stages.length < 2) return null;

    return (
      <svg className={styles.pathLineSvg}>
        {stages.slice(0, -1).map((stage, i) => {
          const nextStage = stages[i + 1];
          const x1 = `${stage.mapPositionX}%`;
          const y1 = `${stage.mapPositionY}%`;
          const x2 = `${nextStage.mapPositionX}%`;
          const y2 = `${nextStage.mapPositionY}%`;

          const isActive = stage.progress && stage.progress.stars > 0;

          return (
            <line
              key={`path-${stage.id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isActive ? 'rgba(100, 255, 100, 0.4)' : 'rgba(100, 100, 140, 0.3)'}
              strokeWidth="2"
              strokeDasharray={isActive ? 'none' : '6 4'}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className={styles.overlay}>
      {/* Header */}
      <div className={styles.header}>
        {/* Resources bar */}
        <div className={styles.resourcesBar}>
          <div className={styles.resourceChip}>
            <span>🪙</span>
            <span>{resources.gold.toLocaleString()}</span>
          </div>
          <div className={styles.resourceChip}>
            <span>💎</span>
            <span>{resources.gems.toLocaleString()}</span>
          </div>
          <div className={styles.resourceChip}>
            <span>⚡</span>
            <span>{resources.energy}/200</span>
          </div>
        </div>
        <div>
          <div className={styles.headerTitle}>
            {chapter ? `Chapter ${chapter.chapterNumber}: ${chapter.title}` : 'Campaign'}
          </div>
          {chapter && <div className={styles.headerSubtitle}>{chapter.description}</div>}
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Difficulty Tabs */}
      <div className={styles.difficultyTabs}>
        {(['easy', 'hard', 'nightmare'] as const).map((diff) => {
          const isUnlocked = unlockedDifficulties.includes(diff);
          return (
            <button
              key={diff}
              className={`${styles.diffTab} ${difficulty === diff ? styles.diffTabActive : ''} ${!isUnlocked ? styles.diffTabLocked : ''}`}
              onClick={() => isUnlocked && setDifficulty(diff)}
              disabled={!isUnlocked}
            >
              {diff === 'easy' ? '⚔️ Easy' : diff === 'hard' ? '🔥 Hard' : '💀 Nightmare'}
              {!isUnlocked && ' 🔒'}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            Loading campaign...
          </div>
        ) : error ? (
          <div className={styles.error}>
            <span>⚠️ {error}</span>
            <button className={styles.retryBtn} onClick={loadChapter}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Map Area */}
            <div className={styles.mapArea}>
              <div className={styles.mapBackground} />
              {renderPaths()}
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className={styles.stageNode}
                  style={{
                    left: `${stage.mapPositionX}%`,
                    top: `${stage.mapPositionY}%`,
                  }}
                  onClick={() => handleStageClick(stage)}
                >
                  <div className={getNodeClass(stage)}>
                    <span className={styles.stageNumber}>{stage.id}</span>
                    {stage.progress && stage.progress.stars > 0 && (
                      <div className={styles.stageStars}>
                        {renderStars(stage.progress.stars)}
                      </div>
                    )}
                  </div>
                  <div className={styles.stageLabel}>{stage.title}</div>
                </div>
              ))}
            </div>

            {/* Detail Panel */}
            <div className={styles.detailPanel}>
              {selectedStage ? (
                <>
                  <div>
                    <div className={styles.detailTitle}>{selectedStage.title}</div>
                    <div className={styles.detailStageId}>Stage {selectedStage.id}</div>
                  </div>

                  <div className={styles.recommendedLevel}>
                    📊 Recommended Level: {selectedStage.recommendedLevel}
                  </div>

                  {/* Enemies */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionTitle}>Enemies</div>
                    <div className={styles.enemyList}>
                      {selectedStage.enemies.map((enemy, i) => (
                        <div key={i} className={styles.enemyItem}>
                          <span className={styles.enemyIcon}>{enemy.icon}</span>
                          <div className={styles.enemyInfo}>
                            <div className={styles.enemyName}>{enemy.name}</div>
                            <div className={styles.enemyLevel}>Lv. {enemy.level}</div>
                          </div>
                          <div className={styles.enemyStats}>
                            ❤️{enemy.hp} ⚔️{enemy.attack}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailSectionTitle}>Rewards</div>
                    <div className={styles.rewardsList}>
                      <div className={styles.rewardItem}>
                        <span className={styles.rewardIcon}>🪙</span>
                        <span className={styles.rewardValue}>{selectedStage.rewards.gold}</span>
                      </div>
                      <div className={styles.rewardItem}>
                        <span className={styles.rewardIcon}>💎</span>
                        <span className={styles.rewardValue}>{selectedStage.rewards.gems}</span>
                      </div>
                      <div className={styles.rewardItem}>
                        <span className={styles.rewardIcon}>✨</span>
                        <span className={styles.rewardValue}>{selectedStage.rewards.playerXp} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Energy Cost */}
                  <div className={styles.energyCost}>
                    <span className={styles.energyIcon}>⚡</span>
                    <span className={styles.energyValue}>
                      Energy Cost: {selectedStage.energyCost}
                    </span>
                  </div>

                  {/* Start Button */}
                  <button
                    className={`${styles.startBtn} ${
                      selectedStage.unlocked ? styles.startBtnActive : styles.startBtnDisabled
                    }`}
                    onClick={handleStartBattle}
                    disabled={!selectedStage.unlocked || clearing}
                  >
                    {clearing
                      ? 'Battling...'
                      : selectedStage.progress && selectedStage.progress.stars > 0
                        ? 'Replay Stage'
                        : 'Start Battle'}
                  </button>
                </>
              ) : (
                <div className={styles.detailPlaceholder}>
                  Select a stage on the map to view details
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Victory Toast */}
      {victory && (
        <div className={styles.victoryToast}>
          <div className={styles.victoryTitle}>🎉 Victory!</div>
          <div className={styles.victoryStars}>{renderStars(victory.stars)}</div>
          <div className={styles.victoryMessage}>
            Cleared "{victory.stageTitle}" with {victory.stars} stars!
          </div>
          <button className={styles.victoryBtn} onClick={handleVictoryClose}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
