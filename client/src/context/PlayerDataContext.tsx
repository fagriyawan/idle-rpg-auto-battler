import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type {
  PlayerProfile,
  PlayerResources,
  HeroDetail,
  FormationPosition,
} from '../types/player-data';
import * as playerApi from '../services/player-api';

const TOKEN_KEY = 'idle_rpg_token';
const MAX_RETRIES = 3;

/** Exponential backoff delays in ms: 1s, 2s, 4s */
function getBackoffDelay(retryCount: number): number {
  return Math.pow(2, retryCount) * 1000;
}

export interface PlayerDataContextType {
  profile: PlayerProfile | null;
  heroes: HeroDetail[];
  formation: string[];
  formationPositions: FormationPosition[];
  resources: PlayerResources;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  fetchProfile: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  saveFormation: (heroIds: string[], positions?: FormationPosition[]) => Promise<void>;
  equipRune: (heroId: string, slotIndex: number, runeId: string) => Promise<void>;
  unequipRune: (heroId: string, slotIndex: number) => Promise<void>;
  upgradeSkill: (heroId: string, skillIndex: number) => Promise<void>;
  retry: () => void;
}

const defaultResources: PlayerResources = { gold: 0, gems: 0, energy: 0 };

const PlayerDataContext = createContext<PlayerDataContextType | undefined>(undefined);

export function PlayerDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [heroes, setHeroes] = useState<HeroDetail[]>([]);
  const [formation, setFormation] = useState<string[]>([]);
  const [formationPositions, setFormationPositions] = useState<FormationPosition[]>([]);
  const [resources, setResources] = useState<PlayerResources>(defaultResources);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const retryCountRef = useRef<number>(0);

  const getToken = useCallback((): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('No authentication token found');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await playerApi.getPlayerProfile(token);

      setProfile(data.profile);
      setResources(data.profile?.resources ?? defaultResources);
      setFormation(data.formation?.heroIds ?? []);
      setFormationPositions(data.formation?.positions ?? []);

      // Fetch full hero details
      const heroDetails = await playerApi.getHeroes(token);
      setHeroes(heroDetails);

      // Reset retry count on success
      retryCountRef.current = 0;
      setRetryCount(0);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load player data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const retry = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES) {
      return;
    }

    const currentRetry = retryCountRef.current;
    retryCountRef.current = currentRetry + 1;
    setRetryCount(currentRetry + 1);

    const delay = getBackoffDelay(currentRetry);
    setTimeout(() => {
      fetchProfile();
    }, delay);
  }, [fetchProfile]);

  const updateDisplayName = useCallback(async (name: string) => {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const { profile: updatedProfile } = await playerApi.updateDisplayName(token, name);
    setProfile(updatedProfile);
    setResources(updatedProfile.resources);
  }, [getToken]);

  const saveFormation = useCallback(async (heroIds: string[], positions: FormationPosition[] = []) => {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const savedFormation = await playerApi.saveFormation(token, heroIds, positions);
    setFormation(savedFormation.heroIds);
    setFormationPositions(savedFormation.positions ?? []);
  }, [getToken]);

  const equipRune = useCallback(async (heroId: string, slotIndex: number, runeId: string) => {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const updatedHero = await playerApi.equipRune(token, heroId, slotIndex, runeId);
    setHeroes((prev) =>
      prev.map((hero) => (hero.id === heroId ? updatedHero : hero))
    );
  }, [getToken]);

  const unequipRune = useCallback(async (heroId: string, slotIndex: number) => {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const updatedHero = await playerApi.unequipRune(token, heroId, slotIndex);
    setHeroes((prev) =>
      prev.map((hero) => (hero.id === heroId ? updatedHero : hero))
    );
  }, [getToken]);

  const upgradeSkill = useCallback(async (heroId: string, skillIndex: number) => {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const updatedHero = await playerApi.upgradeSkill(token, heroId, skillIndex);
    setHeroes((prev) =>
      prev.map((hero) => (hero.id === heroId ? updatedHero : hero))
    );
  }, [getToken]);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const value: PlayerDataContextType = {
    profile,
    heroes,
    formation,
    formationPositions,
    resources,
    isLoading,
    error,
    retryCount,
    fetchProfile,
    updateDisplayName,
    saveFormation,
    equipRune,
    unequipRune,
    upgradeSkill,
    retry,
  };

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  );
}

export function usePlayerData(): PlayerDataContextType {
  const context = useContext(PlayerDataContext);
  if (context === undefined) {
    throw new Error('usePlayerData must be used within a PlayerDataProvider');
  }
  return context;
}

export default PlayerDataContext;
