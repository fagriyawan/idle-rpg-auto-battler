import { useState } from 'react';
import { ethers } from 'ethers';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { isMetaMaskInstalled } from '../services/wallet';
import styles from './LoginPage.module.css';

type LoginView = 'welcome' | 'options' | 'create-wallet' | 'import-wallet';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function VideoBackground() {
  return (
    <>
      <video className={styles.videoBg} autoPlay muted loop playsInline>
        <source src="/assets/login_background_3d.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay} />
    </>
  );
}

export default function LoginPage() {
  const { authState, walletAddress, error, login, loginWithPrivateKey, logout } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<LoginView>('welcome');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generatedAddress, setGeneratedAddress] = useState<string | null>(null);
  const [importKey, setImportKey] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleStartGame = () => {
    navigate('/dashboard');
  };

  const handleStartPlay = () => {
    setView('options');
  };

  const handleBack = () => {
    setView('options');
    setGeneratedKey(null);
    setGeneratedAddress(null);
    setImportKey('');
    setImportError(null);
    setCopied(false);
  };

  const handleCreateWallet = () => {
    const wallet = ethers.Wallet.createRandom();
    setGeneratedKey(wallet.privateKey);
    setGeneratedAddress(wallet.address);
    setView('create-wallet');
  };

  const handleCopyKey = async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePlayWithGeneratedWallet = async () => {
    if (generatedKey) {
      await loginWithPrivateKey(generatedKey);
    }
  };

  const handleImportWallet = () => {
    setView('import-wallet');
    setImportKey('');
    setImportError(null);
  };

  const handleImportSubmit = async () => {
    const key = importKey.trim();
    if (!key) {
      setImportError('Please enter a private key');
      return;
    }
    try {
      new ethers.Wallet(key);
      setImportError(null);
      await loginWithPrivateKey(key);
    } catch {
      setImportError('Invalid private key. Please check and try again.');
    }
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <div className={styles.error}>
        <p>{error}</p>
      </div>
    );
  };

  // Loading state
  if (authState === 'connecting' || authState === 'authenticating') {
    return (
      <div className={styles.container}>
        <VideoBackground />
        <div className={styles.content}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>
            {authState === 'connecting' ? 'Connecting...' : 'Authenticating...'}
          </p>
        </div>
      </div>
    );
  }

  // Authenticated state
  if (authState === 'authenticated' && walletAddress) {
    return (
      <div className={styles.container}>
        <VideoBackground />
        <div className={styles.content}>
          <div className={styles.authenticatedSection}>
            <p className={styles.connectedLabel}>Connected as</p>
            <p className={styles.walletAddress}>
              {truncateAddress(walletAddress)}
            </p>
            <div className={styles.buttonGroup}>
              <button onClick={handleStartGame} className={styles.gameButton}>
                🎮 Enter Game
              </button>
              <button onClick={logout} className={styles.gameButtonSecondary}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create Wallet view
  if (view === 'create-wallet' && generatedKey && generatedAddress) {
    return (
      <div className={styles.container}>
        <VideoBackground />
        <div className={styles.content}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>🔑 Your New Wallet</h2>
            <p className={styles.cardDescription}>
              Save your private key somewhere safe. You will need it to access your account later.
              <strong> Never share it with anyone!</strong>
            </p>
            <div className={styles.keyDisplay}>
              <p className={styles.keyLabel}>Private Key:</p>
              <code className={styles.keyValue}>{generatedKey}</code>
              <button onClick={handleCopyKey} className={styles.copyButton}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <p className={styles.addressLabel}>
              Wallet: <span className={styles.walletAddress}>{truncateAddress(generatedAddress)}</span>
            </p>
            <div className={styles.buttonGroup}>
              <button onClick={handlePlayWithGeneratedWallet} className={styles.gameButton}>
                ⚔️ Start Playing
              </button>
              <button onClick={handleBack} className={styles.gameButtonSecondary}>
                ← Back
              </button>
            </div>
          </div>
          {renderError()}
        </div>
      </div>
    );
  }

  // Import Wallet view
  if (view === 'import-wallet') {
    return (
      <div className={styles.container}>
        <VideoBackground />
        <div className={styles.content}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>📥 Import Wallet</h2>
            <p className={styles.cardDescription}>
              Paste your private key below to access your existing wallet.
            </p>
            <div className={styles.formGroup}>
              <input
                type="password"
                value={importKey}
                onChange={(e) => { setImportKey(e.target.value); setImportError(null); }}
                placeholder="Enter your private key (0x...)"
                className={styles.input}
              />
              {importError && <p className={styles.inputError}>{importError}</p>}
            </div>
            <div className={styles.buttonGroup}>
              <button onClick={handleImportSubmit} className={styles.gameButton}>
                🎮 Import & Play
              </button>
              <button onClick={handleBack} className={styles.gameButtonSecondary}>
                ← Back
              </button>
            </div>
          </div>
          {renderError()}
        </div>
      </div>
    );
  }

  // Options view
  if (view === 'options') {
    const metaMaskAvailable = isMetaMaskInstalled();
    return (
      <div className={styles.container}>
        <VideoBackground />
        <div className={styles.content}>
          {!metaMaskAvailable && (
            <div className={styles.warning}>
              <p>MetaMask not detected. You can still create or import a wallet below.</p>
            </div>
          )}

          <div className={styles.buttonGroup}>
            {metaMaskAvailable && (
              <button onClick={login} className={styles.gameButton}>
                🦊 Connect MetaMask
              </button>
            )}
            <button onClick={handleCreateWallet} className={styles.gameButton}>
              ✨ Create New Wallet
            </button>
            <button onClick={handleImportWallet} className={styles.gameButton}>
              📥 Import Wallet
            </button>
            <button onClick={() => setView('welcome')} className={styles.backLink}>
              ← Back
            </button>
          </div>

          {renderError()}
        </div>
      </div>
    );
  }

  // Welcome view (default)
  return (
    <div className={styles.container}>
      <VideoBackground />
      <div className={styles.contentBottom}>
        <div className={styles.buttonGroup}>
          <button onClick={handleStartPlay} className={styles.gameButton}>
            ⚔️ Start Play
          </button>
        </div>

        {renderError()}
      </div>
    </div>
  );
}
