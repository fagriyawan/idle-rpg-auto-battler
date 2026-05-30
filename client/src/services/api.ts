import type { Player } from '../types';

const BASE_URL = '/api';
const TOKEN_KEY = 'idle_rpg_token';

export async function getNonce(walletAddress: string): Promise<{ nonce: string; message: string }> {
  const response = await fetch(`${BASE_URL}/auth/nonce?walletAddress=${encodeURIComponent(walletAddress)}`);
  if (!response.ok) {
    throw new Error(`Failed to get nonce: ${response.statusText}`);
  }
  return response.json();
}

export async function verifySignature(
  walletAddress: string,
  signature: string,
  nonce: string
): Promise<{ token: string; player: Player }> {
  const response = await fetch(`${BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, signature, nonce }),
  });
  if (!response.ok) {
    throw new Error(`Failed to verify signature: ${response.statusText}`);
  }
  return response.json();
}

export async function getMe(token: string): Promise<{ player: Player }> {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/';
    throw new Error('Session expired');
  }
  if (!response.ok) {
    throw new Error(`Failed to get player: ${response.statusText}`);
  }
  return response.json();
}
