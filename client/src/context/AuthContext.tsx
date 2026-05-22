import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { ethers } from 'ethers';
import type { Player, AuthState } from '../types';
import { connectMetaMask, signMessage, onAccountChanged } from '../services/wallet';
import { getNonce, verifySignature, getMe } from '../services/api';

const TOKEN_KEY = 'idle_rpg_token';

export interface AuthContextType {
  authState: AuthState;
  player: Player | null;
  walletAddress: string | null;
  error: string | null;
  login: () => Promise<void>;
  loginWithPrivateKey: (privateKey: string) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getUserFriendlyError(err: unknown): string {
  if (err instanceof Error) {
    // MetaMask user rejected
    if (err.message.includes('user-denied') || err.message.includes('User rejected') || err.message.includes('ACTION_REJECTED') || err.message.includes('4001')) {
      return 'Connection cancelled. Please try again when ready.';
    }
    if (err.message.includes('MetaMask is not installed')) {
      return 'MetaMask is not installed. Please install it first.';
    }
    if (err.message.includes('Failed to verify')) {
      return 'Authentication failed. Please try again.';
    }
    return err.message;
  }
  return 'Authentication failed';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('disconnected');
  const [player, setPlayer] = useState<Player | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthState('disconnected');
    setPlayer(null);
    setWalletAddress(null);
    setError(null);
  }, []);

  const checkSession = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return;
    }

    try {
      const { player: fetchedPlayer } = await getMe(token);
      setPlayer(fetchedPlayer);
      setWalletAddress(fetchedPlayer.walletAddress);
      setAuthState('authenticated');
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setAuthState('disconnected');
      setPlayer(null);
      setWalletAddress(null);
    }
  }, []);

  const login = useCallback(async () => {
    try {
      setError(null);
      setAuthState('connecting');

      const address = await connectMetaMask();
      setWalletAddress(address);
      setAuthState('authenticating');

      const { nonce, message } = await getNonce(address);
      const signature = await signMessage(message);
      const { token, player: verifiedPlayer } = await verifySignature(address, signature, nonce);

      localStorage.setItem(TOKEN_KEY, token);
      setPlayer(verifiedPlayer);
      setAuthState('authenticated');
    } catch (err) {
      setError(getUserFriendlyError(err));
      setAuthState('disconnected');
    }
  }, []);

  const loginWithPrivateKey = useCallback(async (privateKey: string) => {
    try {
      setError(null);
      setAuthState('authenticating');

      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey);
      const address = wallet.address;
      setWalletAddress(address);

      // Get nonce from backend
      const { nonce, message } = await getNonce(address);

      // Sign message with the private key directly
      const signature = await wallet.signMessage(message);

      // Verify with backend
      const { token, player: verifiedPlayer } = await verifySignature(address, signature, nonce);

      localStorage.setItem(TOKEN_KEY, token);
      setPlayer(verifiedPlayer);
      setAuthState('authenticated');
    } catch (err) {
      setError(getUserFriendlyError(err));
      setAuthState('disconnected');
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Listen for account changes — logout if account switches
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0 || accounts[0] !== walletAddress) {
        logout();
      }
    };

    onAccountChanged(handleAccountsChanged);
  }, [walletAddress, logout]);

  const value: AuthContextType = {
    authState,
    player,
    walletAddress,
    error,
    login,
    loginWithPrivateKey,
    logout,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
