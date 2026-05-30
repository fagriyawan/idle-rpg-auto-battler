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

  describe('skel36 path (atlas with index field)', () => {
    it('returns skel36 when atlas text contains index: field (pma:true header)', () => {
      const atlasText = `cream_arcade_000.png\npma:true\nsize: 512,384\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\nArm_Left\n  rotate: false\n  xy: 239, 20\n  size: 39, 49\n  orig: 39, 49\n  offset: 0, 0\n  index: -1\n`;
      const result = detectFormat(undefined, '/assets/heroes/003/L05001.skel', atlasText);
      expect(result).toBe('skel36');
    });

    it('returns skel36 when atlas text contains index: field (pma:false header)', () => {
      const atlasText = `crew110016.png\nsize: 1024,1024\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\npma: false\nBody\n  rotate: false\n  xy: 0, 0\n  size: 100, 100\n  orig: 100, 100\n  offset: 0, 0\n  index: -1\n`;
      const result = detectFormat(undefined, '/assets/heroes/005/crew110016.skel', atlasText);
      expect(result).toBe('skel36');
    });

    it('returns skel36 when atlas has index field with extra whitespace', () => {
      const atlasText = `texture.png\nsize: 512,512\npma: true\nfilter: Linear,Linear\nregion1\n  rotate: false\n  xy: 0, 0\n  size: 50, 50\n  orig: 50, 50\n  offset: 0, 0\n  index: -1\n`;
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

    it('returns skel38 when atlas has content but no index: field', () => {
      const atlasText = `texture.png\nsize: 512,512\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\nregion1\n  rotate: false\n  xy: 0, 0\n  size: 100, 100\n  orig: 100, 100\n`;
      // No "index:" field present — indicates Spine 3.8 format
      const result = detectFormat(undefined, '/some/path.skel', atlasText);
      expect(result).toBe('skel38');
    });
  });
});
