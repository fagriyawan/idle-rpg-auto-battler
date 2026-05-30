import { describe, it, expect } from 'vitest';
import { calculateAttributes } from '../utils/hero.utils';
import { HeroAttributes } from '../types/player';

describe('Hero Utils', () => {
  describe('calculateAttributes', () => {
    it('should return base attributes unchanged at level 1, star 1', () => {
      const base: HeroAttributes = { attack: 100, armor: 50, hp: 500 };
      const result = calculateAttributes(base, 1, 1);

      // level 1: multiplier = 1 + 0.05 * (1-1) = 1.0
      // star 1: multiplier = 1.0
      // floor(100 * 1.0 * 1.0) = 100
      expect(result).toEqual({ attack: 100, armor: 50, hp: 500 });
    });

    it('should apply level multiplier correctly at level 10, star 1', () => {
      const base: HeroAttributes = { attack: 100, armor: 50, hp: 500 };
      const result = calculateAttributes(base, 10, 1);

      // level 10: multiplier = 1 + 0.05 * (10-1) = 1.45
      // star 1: multiplier = 1.0
      // floor(100 * 1.0 * 1.45) = 145
      // floor(50 * 1.0 * 1.45) = 72
      // floor(500 * 1.0 * 1.45) = 725
      expect(result).toEqual({ attack: 145, armor: 72, hp: 725 });
    });

    it('should apply star multiplier correctly at level 1, star 3', () => {
      const base: HeroAttributes = { attack: 100, armor: 50, hp: 500 };
      const result = calculateAttributes(base, 1, 3);

      // level 1: multiplier = 1.0
      // star 3: multiplier = 1.5
      // floor(100 * 1.5 * 1.0) = 150
      // floor(50 * 1.5 * 1.0) = 75
      // floor(500 * 1.5 * 1.0) = 750
      expect(result).toEqual({ attack: 150, armor: 75, hp: 750 });
    });

    it('should apply both level and star multipliers at level 20, star 5', () => {
      const base: HeroAttributes = { attack: 100, armor: 50, hp: 500 };
      const result = calculateAttributes(base, 20, 5);

      // level 20: multiplier = 1 + 0.05 * (20-1) = 1.95
      // star 5: multiplier = 2.2
      // floor(100 * 2.2 * 1.95) = floor(429) = 429
      // floor(50 * 2.2 * 1.95) = floor(214.5) = 214
      // floor(500 * 2.2 * 1.95) = floor(2145) = 2145
      expect(result).toEqual({ attack: 429, armor: 214, hp: 2145 });
    });

    it('should floor fractional results', () => {
      const base: HeroAttributes = { attack: 7, armor: 3, hp: 11 };
      const result = calculateAttributes(base, 2, 2);

      // level 2: multiplier = 1 + 0.05 * (2-1) = 1.05
      // star 2: multiplier = 1.2
      // floor(7 * 1.2 * 1.05) = floor(8.82) = 8
      // floor(3 * 1.2 * 1.05) = floor(3.78) = 3
      // floor(11 * 1.2 * 1.05) = floor(13.86) = 13
      expect(result).toEqual({ attack: 8, armor: 3, hp: 13 });
    });

    it('should handle max level (100) and max stars (5)', () => {
      const base: HeroAttributes = { attack: 100, armor: 50, hp: 500 };
      const result = calculateAttributes(base, 100, 5);

      // level 100: multiplier = 1 + 0.05 * (100-1) = 5.95
      // star 5: multiplier = 2.2
      // floor(100 * 2.2 * 5.95) = floor(1309) = 1309
      // floor(50 * 2.2 * 5.95) = floor(654.5) = 654
      // floor(500 * 2.2 * 5.95) = floor(6545) = 6545
      expect(result).toEqual({ attack: 1309, armor: 654, hp: 6545 });
    });
  });
});
