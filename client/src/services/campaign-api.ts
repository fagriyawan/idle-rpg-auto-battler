import type {
  CampaignChapter,
  CampaignStageWithProgress,
  PlayerStageProgress,
} from '../types/campaign';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Handles API responses with 401 redirect and error extraction.
 */
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
 * Fetches a chapter with all stages, player progress, and unlock status.
 */
export async function getChapterWithStages(
  token: string,
  chapterId: string
): Promise<{ chapter: CampaignChapter; stages: CampaignStageWithProgress[]; unlockedDifficulties?: string[] }> {
  const response = await fetch(`${API_BASE_URL}/api/campaign/chapters/${chapterId}`, {
    headers: authHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Fetches a single stage with progress and unlock status.
 */
export async function getStageDetail(
  token: string,
  stageId: string
): Promise<CampaignStageWithProgress> {
  const response = await fetch(`${API_BASE_URL}/api/campaign/stages/${stageId}`, {
    headers: authHeaders(token),
  });
  return handleResponse(response);
}

/**
 * Battle reward result from server after stage clear.
 */
export interface BattleRewardResult {
  progress: PlayerStageProgress;
  rewards: {
    gold: number;
    gems: number;
    playerXp: number;
    heroXp: number;
  };
  player: {
    levelBefore: number;
    levelAfter: number;
    xpBefore: number;
    xpAfter: number;
    xpToNextLevel: number;
  };
  heroes: Array<{
    heroId: string;
    name: string;
    heroTemplateId: string;
    levelBefore: number;
    levelAfter: number;
    xpBefore: number;
    xpAfter: number;
    xpToNextLevel: number;
  }>;
  stars: number;
}

/**
 * Records a stage clear with star rating. Awards rewards server-side.
 * Returns detailed reward breakdown for victory screen.
 */
export async function recordStageClear(
  token: string,
  stageId: string,
  stars: number,
  heroIds?: string[],
  difficulty?: string
): Promise<BattleRewardResult> {
  const response = await fetch(`${API_BASE_URL}/api/campaign/stages/${stageId}/clear`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ stars, heroIds, difficulty }),
  });
  return handleResponse(response);
}
