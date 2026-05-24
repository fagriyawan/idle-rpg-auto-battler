import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseTexture } from 'pixi.js';
import { TextureCache } from './texture-cache';

// Mock pixi.js to avoid WebGL context requirement
vi.mock('pixi.js', () => ({
  BaseTexture: class MockBaseTexture {
    destroy = vi.fn();
  },
}));

function createMockTexture(): BaseTexture {
  return { destroy: vi.fn() } as unknown as BaseTexture;
}

describe('TextureCache', () => {
  let cache: TextureCache;

  beforeEach(() => {
    cache = new TextureCache();
  });

  it('get() returns null for unknown URLs', () => {
    expect(cache.get('http://example.com/unknown.png')).toBeNull();
    expect(cache.get('')).toBeNull();
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('set() stores a texture, get() retrieves it', () => {
    const texture = createMockTexture();
    const url = 'http://example.com/atlas.png';

    cache.set(url, texture);
    const retrieved = cache.get(url);

    expect(retrieved).toBe(texture);
  });

  it('set() same URL twice increments refCount without duplicating', () => {
    const texture = createMockTexture();
    const url = 'http://example.com/atlas.png';

    cache.set(url, texture);
    cache.set(url, texture);

    // refCount should be 2 from two set() calls
    // One release should not destroy it
    cache.release(url);
    expect(texture.destroy).not.toHaveBeenCalled();

    // Second release brings refCount to 0, should destroy
    cache.release(url);
    expect(texture.destroy).toHaveBeenCalledOnce();
  });

  it('release() decrements refCount', () => {
    const texture = createMockTexture();
    const url = 'http://example.com/atlas.png';

    cache.set(url, texture);
    // get() also increments refCount, so refCount is now 2
    cache.get(url);

    // First release: refCount goes from 2 to 1
    cache.release(url);
    expect(texture.destroy).not.toHaveBeenCalled();

    // Texture should still be retrievable
    expect(cache.get(url)).toBe(texture);
  });

  it('release() at refCount 0 calls texture.destroy() and removes entry', () => {
    const texture = createMockTexture();
    const url = 'http://example.com/atlas.png';

    cache.set(url, texture); // refCount = 1
    cache.release(url); // refCount = 0 → destroy

    expect(texture.destroy).toHaveBeenCalledOnce();
    // Entry should be removed from cache
    expect(cache.get(url)).toBeNull();
  });

  it('clear() destroys all textures and empties cache', () => {
    const texture1 = createMockTexture();
    const texture2 = createMockTexture();
    const texture3 = createMockTexture();

    cache.set('url1.png', texture1);
    cache.set('url2.png', texture2);
    cache.set('url3.png', texture3);

    cache.clear();

    expect(texture1.destroy).toHaveBeenCalledOnce();
    expect(texture2.destroy).toHaveBeenCalledOnce();
    expect(texture3.destroy).toHaveBeenCalledOnce();

    // All entries should be gone
    expect(cache.get('url1.png')).toBeNull();
    expect(cache.get('url2.png')).toBeNull();
    expect(cache.get('url3.png')).toBeNull();
  });

  it('get() increments refCount on access', () => {
    const texture = createMockTexture();
    const url = 'http://example.com/atlas.png';

    cache.set(url, texture); // refCount = 1
    cache.get(url); // refCount = 2
    cache.get(url); // refCount = 3

    // Need 3 releases to destroy
    cache.release(url); // refCount = 2
    expect(texture.destroy).not.toHaveBeenCalled();

    cache.release(url); // refCount = 1
    expect(texture.destroy).not.toHaveBeenCalled();

    cache.release(url); // refCount = 0 → destroy
    expect(texture.destroy).toHaveBeenCalledOnce();
  });
});
