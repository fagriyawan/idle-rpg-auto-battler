import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import HeroesPanel from './HeroesPanel';
import styles from './Dashboard.module.css';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const MENU_ITEMS = [
  { id: 'campaign', label: 'Campaign', icon: '🗺️' },
  { id: 'heroes', label: 'Heroes', icon: '⚔️' },
  { id: 'summon', label: 'Summon', icon: '🔮' },
  { id: 'inventory', label: 'Inventory', icon: '🎒' },
  { id: 'formation', label: 'Formation', icon: '🛡️' },
];

export default function Dashboard() {
  const { player, walletAddress, logout } = useAuth();
  const navigate = useNavigate();
  const [popup, setPopup] = useState<string | null>(null);
  const [showHeroes, setShowHeroes] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMenuClick = (menuId: string, label: string) => {
    if (menuId === 'heroes') {
      setShowHeroes(true);
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

  return (
    <div className={styles.container}>
      {/* Background */}
      <div className={styles.background} />

      {/* Top HUD */}
      <div className={styles.topHud}>
        {/* Player Info - Top Left */}
        <div className={styles.playerInfo}>
          <div className={styles.avatar}>
            <span className={styles.avatarIcon}>🧙</span>
          </div>
          <div className={styles.playerDetails}>
            <span className={styles.playerName}>{truncateAddress(walletAddress)}</span>
            <span className={styles.playerLevel}>Lv. 1</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
            ⏻
          </button>
        </div>

        {/* Resources - Top Right */}
        <div className={styles.resources}>
          <div className={styles.resourceItem}>
            <span className={styles.resourceIcon}>🪙</span>
            <span className={styles.resourceValue}>15,000</span>
          </div>
          <div className={styles.resourceItem}>
            <span className={styles.resourceIcon}>💎</span>
            <span className={styles.resourceValue}>250</span>
          </div>
          <div className={styles.resourceItem}>
            <span className={styles.resourceIcon}>⚡</span>
            <span className={styles.resourceValue}>80/100</span>
          </div>
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
      {showHeroes && <HeroesPanel onClose={() => setShowHeroes(false)} />}
    </div>
  );
}
