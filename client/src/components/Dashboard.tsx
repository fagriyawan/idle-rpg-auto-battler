import { useMemo, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePlayerData } from '../context/PlayerDataContext';
import { useNavigate } from 'react-router-dom';
import HeroesPanel from './HeroesPanel';
import FormationPanel from './FormationPanel';
import MessagePanel from './MessagePanel';
import CampaignPanel from './CampaignPanel';
import BattlePage from './BattlePage';
import CharacterDetailPanel from './CharacterDetailPanel/CharacterDetailPanel';
import LoadingScreen from './LoadingScreen';
import { getClassIcon, getSpineAssets } from '../utils/hero-display';
import type { HeroDetail } from '../types/hero-detail';
import styles from './Dashboard.module.css';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

const MENU_ITEMS = [
  { id: 'campaign', label: 'Campaign', icon: '🗺️' },
  { id: 'heroes', label: 'Heroes', icon: '⚔️' },
  { id: 'summon', label: 'Summon', icon: '🔮' },
  { id: 'messages', label: 'Message', icon: '📬' },
  { id: 'inventory', label: 'Inventory', icon: '🎒' },
  { id: 'formation', label: 'Formation', icon: '🛡️' },
];

export default function Dashboard() {
  const { player, walletAddress, logout } = useAuth();
  const { profile, heroes, formation, resources, isLoading, error, retry, retryCount } = usePlayerData();
  const navigate = useNavigate();
  const [popup, setPopup] = useState<string | null>(null);
  const [showHeroes, setShowHeroes] = useState(false);
  const [showFormation, setShowFormation] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);
  const [showCharacterDetail, setShowCharacterDetail] = useState(false);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
  const [battleStageId, setBattleStageId] = useState<string | null>(null);
  const [battleDifficulty, setBattleDifficulty] = useState<string>('easy');
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  const handleAssetsLoaded = useCallback(() => {
    setAssetsLoaded(true);
  }, []);

  // Map server heroes to the HeroDetail format expected by CharacterDetailPanel
  const formationSet = useMemo(() => new Set(formation), [formation]);
  const heroDetails: HeroDetail[] = useMemo(() => {
    return heroes.map((hero) => {
      const spineAssets = getSpineAssets(hero.heroTemplateId);
      return {
        id: hero.id,
        name: hero.name,
        level: hero.level,
        stars: hero.stars,
        classType: hero.classType,
        classIcon: getClassIcon(hero.classType),
        spine: {
          jsonUrl: spineAssets.jsonUrl,
          skelUrl: spineAssets.skelUrl,
          atlasUrl: spineAssets.atlasUrl,
          animation: spineAssets.animation,
        },
        active: formationSet.has(hero.id),
        attributes: hero.attributes,
        skills: hero.skills,
        runes: hero.runes,
      };
    });
  }, [heroes, formationSet]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMenuClick = (menuId: string, label: string) => {
    if (menuId === 'heroes') {
      setShowHeroes(true);
    } else if (menuId === 'formation') {
      setShowFormation(true);
    } else if (menuId === 'messages') {
      setShowMessages(true);
    } else if (menuId === 'campaign') {
      setShowCampaign(true);
    } else {
      setPopup(`${label} clicked`);
    }
  };

  const closePopup = () => {
    setPopup(null);
  };

  if (!player || !walletAddress) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading screen while spine assets are being preloaded
  if (!assetsLoaded) {
    return <LoadingScreen onComplete={handleAssetsLoaded} />;
  }

  // Full-screen battle page replaces the dashboard
  if (battleStageId) {
    return (
      <BattlePage
        stageId={battleStageId}
        difficulty={battleDifficulty}
        onExit={() => setBattleStageId(null)}
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Background */}
      <div className={styles.background} />

      {/* Top HUD */}
      <div className={styles.topHud}>
        {/* Player Info - Top Left */}
        <div className={styles.playerInfo}>
          {isLoading ? (
            <div className={styles.hudSkeleton}>
              <div className={styles.skeletonCircle} />
              <div className={styles.skeletonLines}>
                <div className={styles.skeletonLine} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
              </div>
            </div>
          ) : error ? (
            <div className={styles.hudError}>
              <span className={styles.errorIcon}>⚠️</span>
              <span className={styles.errorText}>Failed to load</span>
              {retryCount < 3 && (
                <button onClick={retry} className={styles.retryBtn}>
                  Retry
                </button>
              )}
            </div>
          ) : (
            <>
              <div className={styles.avatar}>
                <span className={styles.avatarIcon}>🧙</span>
              </div>
              <div className={styles.playerDetails}>
                <span className={styles.playerName}>
                  {profile?.displayName || truncateAddress(walletAddress)}
                </span>
                <span className={styles.playerLevel}>Lv. {profile?.level ?? 1}</span>
              </div>
              <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
                ⏻
              </button>
            </>
          )}
        </div>

        {/* Resources - Top Right */}
        <div className={styles.resources}>
          {isLoading ? (
            <>
              <div className={`${styles.resourceItem} ${styles.resourceSkeleton}`}>
                <div className={styles.skeletonPulse} />
              </div>
              <div className={`${styles.resourceItem} ${styles.resourceSkeleton}`}>
                <div className={styles.skeletonPulse} />
              </div>
              <div className={`${styles.resourceItem} ${styles.resourceSkeleton}`}>
                <div className={styles.skeletonPulse} />
              </div>
            </>
          ) : error ? (
            <div className={`${styles.resourceItem} ${styles.resourceError}`}>
              <span className={styles.errorIcon}>⚠️</span>
              <span className={styles.resourceValue}>--</span>
            </div>
          ) : (
            <>
              <div className={styles.resourceItem}>
                <span className={styles.resourceIcon}>🪙</span>
                <span className={styles.resourceValue}>{formatNumber(resources.gold)}</span>
              </div>
              <div className={styles.resourceItem}>
                <span className={styles.resourceIcon}>💎</span>
                <span className={styles.resourceValue}>{formatNumber(resources.gems)}</span>
              </div>
              <div className={styles.resourceItem}>
                <span className={styles.resourceIcon}>⚡</span>
                <span className={styles.resourceValue}>{resources.energy}/200</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center Stage Area */}
      <div className={styles.stageArea}>
        <div className={styles.arena} />
      </div>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav}>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            className={styles.navItem}
            onClick={() => handleMenuClick(item.id, item.label)}
            disabled={isLoading}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Popup */}
      {popup && (
        <div className={styles.popupOverlay} onClick={closePopup}>
          <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <p className={styles.popupText}>{popup}</p>
            <button onClick={closePopup} className={styles.popupClose}>OK</button>
          </div>
        </div>
      )}

      {/* Heroes Panel */}
      {showHeroes && (
        <HeroesPanel
          onClose={() => setShowHeroes(false)}
          onHeroSelect={(index) => {
            setSelectedHeroIndex(index);
            setShowHeroes(false);
            setShowCharacterDetail(true);
          }}
        />
      )}

      {/* Character Detail Panel */}
      {showCharacterDetail && (
        <CharacterDetailPanel
          heroes={heroDetails}
          initialHeroIndex={selectedHeroIndex}
          onClose={() => setShowCharacterDetail(false)}
        />
      )}

      {/* Formation Panel */}
      {showFormation && (
        <FormationPanel onClose={() => setShowFormation(false)} />
      )}

      {/* Message Panel */}
      {showMessages && (
        <MessagePanel onClose={() => setShowMessages(false)} />
      )}

      {/* Campaign Panel */}
      {showCampaign && (
        <CampaignPanel
          onClose={() => setShowCampaign(false)}
          onStartBattle={(stageId, diff) => {
            setShowCampaign(false);
            setBattleStageId(stageId);
            setBattleDifficulty(diff || 'easy');
          }}
        />
      )}
    </div>
  );
}
