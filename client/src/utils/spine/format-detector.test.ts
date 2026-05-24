import { describe, it, expect } from 'vitest';
import { detectFormat } from './format-detector';

describe('FormatDetector - detectFormat', () => {
  describe('json36 path', () => {
    it('returns json36 when jsonUrl is provided', () => {
      const result = detectFormat('/assets/heroes/001/cream_arcade_000.json');
      expect(result).toBe('json36');
    });

    it('returns json36 when jsonUrl is provided regardless of skelUrl and atlasText', () => {
      const atlasText = `cream_arcade_000.png\nsize: 512,384\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\npma: true\n`;
      const result = detectFormat(
        '/assets/heroes/001/cream_arcade_000.json',
        '/assets/heroes/003/L05001.skel',
        atlasText
      );
      expect(result).toBe('json36');
    });
  });

  describe('skel36 path (atlas with pma line)', () => {
    it('returns skel36 when atlas text contains pma:true', () => {
      const atlasText = `cream_arcade_000.png\nsize: 512,384\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\npma: true\n`;
      const result = detectFormat(undefined, '/assets/heroes/003/L05001.skel', atlasText);
      expect(result).toBe('skel36');
    });

    it('returns skel36 when atlas text contains pma:false', () => {
      const atlasText = `crew110016.png\nsize: 1024,1024\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\npma: false\n`;
      const result = detectFormat(undefined, '/assets/heroes/005/crew110016.skel', atlasText);
      expect(result).toBe('skel36');
    });

    it('returns skel36 when pma line has extra whitespace', () => {
      const atlasText = `texture.png\nsize: 512,512\n  pma: true\nfilter: Linear,Linear\n`;
      const result = detectFormat(undefined, '/some/path.skel', atlasText);
      expect(result).toBe('skel36');
    });
  });

  describe('skel38 path (atlas without pma line)', () => {
    it('returns skel38 when atlas text does NOT contain pma line', () => {
      const atlasText = `H30103.png\nsize: 2048,2048\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\n`;
      const result = detectFormat(undefined, '/assets/heroes/004/H30103.skel', atlasText);
      expect(result).toBe('skel38');
    });
  });

  describe('default fallback', () => {
    it('returns skel36 when no atlasText is provided', () => {
      const result = detectFormat(undefined, '/assets/heroes/003/L05001.skel', undefined);
      expect(result).toBe('skel36');
    });

    it('returns skel36 when no arguments are provided', () => {
      const result = detectFormat();
      expect(result).toBe('skel36');
    });
  });

  describe('edge cases', () => {
    it('returns skel36 (default) when atlas text is empty string', () => {
      // Empty string is falsy, so it falls through to the default skel36
      const result = detectFormat(undefined, '/some/path.skel', '');
      expect(result).toBe('skel36');
    });

    it('returns skel38 when atlas has content but no pma line in first 10 lines', () => {
      const atlasText = `texture.png\nsize: 512,512\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\nregion1\n  rotate: false\n  xy: 0, 0\n  size: 100, 100\n  orig: 100, 100\npma: true\n`;
      // pma: true is on line 11 (0-indexed line 10), outside the first 10 lines inspected
      const result = detectFormat(undefined, '/some/path.skel', atlasText);
      expect(result).toBe('skel38');
    });
  });
});
