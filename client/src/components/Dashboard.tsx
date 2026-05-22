import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './Dashboard.module.css';

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString();
}

export default function Dashboard() {
  const { player, walletAddress, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!player) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.welcome}>Welcome, Commander!</h1>

        <p className={styles.label}>Wallet</p>
        <p className={styles.walletAddress}>
          {truncateAddress(walletAddress ?? player.walletAddress)}
        </p>

        <p className={styles.label}>Last Login</p>
        <p className={styles.lastLogin}>
          {formatTimestamp(player.lastLoginAt)}
        </p>

        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
