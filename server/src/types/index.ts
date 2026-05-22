export interface Player {
  id: string;
  walletAddress: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthNonce {
  id: string;
  walletAddress: string;
  nonce: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

export interface VerifyRequest {
  walletAddress: string;
  signature: string;
  nonce: string;
}

export interface NonceResponse {
  nonce: string;
  message: string;
}

export interface AuthResponse {
  token: string;
  player: Player;
}
