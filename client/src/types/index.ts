export interface Player {
  id: string;
  walletAddress: string;
  createdAt: string;
  lastLoginAt: string;
}

export type AuthState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'authenticating'
  | 'authenticated';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
}
