import type {
  PlayerProfileResponse,
  PlayerProfile,
  HeroDetail,
  Formation,
  FormationPosition,
} from '../types/player-data';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const TOKEN_KEY = 'idle_rpg_token';

/**
 * Handles 401 responses by clearing the session and redirecting to login.
 * For other errors, throws with the error message from the response body.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error || `Request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Creates standard headers with JWT authorization.
 */
function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetches the aggregated player profile (profile + heroes summary + formation).
 */
export async function getPlayerProfile(token: string): Promise<PlayerProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/player/profile`, {
    headers: authHeaders(token),
  });
  return handleResponse<PlayerProfileResponse>(response);
}

/**
 * Updates the player's display name.
 */
export async function updateDisplayName(
  token: string,
  name: string
): Promise<{ profile: PlayerProfile }> {
  const response = await fetch(`${API_BASE_URL}/api/player/display-name`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ displayName: name }),
  });
  return handleResponse<{ profile: PlayerProfile }>(response);
}

/**
 * Fetches the full hero roster for the player.
 */
export async function getHeroes(token: string): Promise<HeroDetail[]> {
  const response = await fetch(`${API_BASE_URL}/api/player/heroes`, {
    headers: authHeaders(token),
  });
  return handleResponse<HeroDetail[]>(response);
}

/**
 * Fetches detailed information for a specific hero.
 */
export async function getHeroDetail(token: string, heroId: string): Promise<HeroDetail> {
  const response = await fetch(`${API_BASE_URL}/api/player/heroes/${heroId}`, {
    headers: authHeaders(token),
  });
  return handleResponse<HeroDetail>(response);
}

/**
 * Saves the player's battle formation.
 */
export async function saveFormation(
  token: string,
  heroIds: string[],
  positions: FormationPosition[] = []
): Promise<Formation> {
  const response = await fetch(`${API_BASE_URL}/api/player/formation`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ heroIds, positions }),
  });
  return handleResponse<Formation>(response);
}

/**
 * Equips a rune from inventory to a hero's slot.
 */
export async function equipRune(
  token: string,
  heroId: string,
  slotIndex: number,
  runeId: string
): Promise<HeroDetail> {
  const response = await fetch(`${API_BASE_URL}/api/player/heroes/${heroId}/equip-rune`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ slotIndex, runeId }),
  });
  return handleResponse<HeroDetail>(response);
}

/**
 * Unequips a rune from a hero's slot back to inventory.
 */
export async function unequipRune(
  token: string,
  heroId: string,
  slotIndex: number
): Promise<HeroDetail> {
  const response = await fetch(`${API_BASE_URL}/api/player/heroes/${heroId}/unequip-rune`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ slotIndex }),
  });
  return handleResponse<HeroDetail>(response);
}

/**
 * Upgrades a hero's skill at the given index.
 */
export async function upgradeSkill(
  token: string,
  heroId: string,
  skillIndex: number
): Promise<HeroDetail> {
  const response = await fetch(`${API_BASE_URL}/api/player/heroes/${heroId}/upgrade-skill`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ skillIndex }),
  });
  return handleResponse<HeroDetail>(response);
}
