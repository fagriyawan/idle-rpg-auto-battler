import { describe, it, expect } from 'vitest';
import {
  calculateLevelFromExperience,
  generateDefaultDisplayName,
} from '../utils/player.utils';
import { experienceForLevel, MAX_PLAYER_LEVEL } from '../config/game-constants';

describe('calculateLevelFromExperience', () => {
  it('returns level 1 with 0 XP', () => {
    const result = calculateLevelFromExperience(0);
    expect(result.level).toBe(1);
    // experienceForLevel(2) = 100 * 2 * 1 / 2 = 100
    expect(result.experienceToNextLevel).toBe(100);
  });

  it('returns level 1 with 99 XP (just below level 2 threshold)', () => {
    const result = calculateLevelFromExperience(99);
    expect(result.level).toBe(1);
    expect(result.experienceToNextLevel).toBe(1);
  });

  it('returns level 2 with exactly 100 XP', () => {
    // experienceForLevel(2) = 100 * 2 * 1 / 2 = 100
    const result = calculateLevelFromExperience(100);
    expect(result.level).toBe(2);
    // experienceForLevel(3) = 100 * 3 * 2 / 2 = 300
    expect(result.experienceToNextLevel).toBe(200);
  });

  it('returns level 10 at the exact threshold', () => {
    // experienceForLevel(10) = 100 * 10 * 9 / 2 = 4500
    const xp = experienceForLevel(10);
    const result = calculateLevelFromExperience(xp);
    expect(result.level).toBe(10);
    // experienceForLevel(11) = 100 * 11 * 10 / 2 = 5500
    expect(result.experienceToNextLevel).toBe(experienceForLevel(11) - xp);
  });

  it('returns level 100 at max level threshold', () => {
    // experienceForLevel(100) = 100 * 100 * 99 / 2 = 495000
    const xp = experienceForLevel(100);
    const result = calculateLevelFromExperience(xp);
    expect(result.level).toBe(100);
    expect(result.experienceToNextLevel).toBe(0);
  });

  it('returns level 100 with XP beyond max level', () => {
    const xp = experienceForLevel(100) + 999999;
    const result = calculateLevelFromExperience(xp);
    expect(result.level).toBe(100);
    expect(result.experienceToNextLevel).toBe(0);
  });

  it('returns correct level for mid-range XP', () => {
    // experienceForLevel(5) = 100 * 5 * 4 / 2 = 1000
    // experienceForLevel(6) = 100 * 6 * 5 / 2 = 1500
    const result = calculateLevelFromExperience(1200);
    expect(result.level).toBe(5);
    expect(result.experienceToNextLevel).toBe(300);
  });
});

describe('generateDefaultDisplayName', () => {
  it('generates name from wallet address with lowercase hex', () => {
    const result = generateDefaultDisplayName('0x1a2b3cDEF456789012345678901234567890abcd');
    expect(result).toBe('Player_1a2b3c');
  });

  it('lowercases uppercase hex characters', () => {
    const result = generateDefaultDisplayName('0xABCDEF1234567890123456789012345678901234');
    expect(result).toBe('Player_abcdef');
  });

  it('handles mixed case wallet address', () => {
    const result = generateDefaultDisplayName('0xFf00Aa112233445566778899aabbccddeeff0011');
    expect(result).toBe('Player_ff00aa');
  });

  it('uses exactly 6 characters after 0x prefix', () => {
    const result = generateDefaultDisplayName('0x123456789abcdef0123456789abcdef012345678');
    expect(result).toBe('Player_123456');
  });
});
