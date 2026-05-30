import type { BattleInitData } from '../types/battle';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    localStorage.removeItem('idle_rpg_token');
    window.location.href = '/';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || `Request failed: ${response.statusText}`);
  }

  return response.json();
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetches all data needed to initialize a battle for a given stage.
 * @param difficulty - "easy" | "hard" | "nightmare" (defaults to "easy")
 */
export async function getBattleInit(token: string, stageId: string, difficulty: string = 'easy'): Promise<BattleInitData> {
  const response = await fetch(`${API_BASE_URL}/api/battle/stage/${stageId}/init?difficulty=${encodeURIComponent(difficulty)}`, {
    headers: authHeaders(token),
  });
  return handleResponse(response);
}
