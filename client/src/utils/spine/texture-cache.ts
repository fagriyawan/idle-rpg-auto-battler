import { BaseTexture } from 'pixi.js';

interface CachedTexture {
  texture: BaseTexture;
  refCount: number;
}

/**
 * Shared texture cache with reference counting.
 * Prevents duplicate GPU texture uploads when multiple hero cards
 * reference the same atlas texture.
 */
export class TextureCache {
  private cache = new Map<string, CachedTexture>();

  /**
   * Get a cached texture by URL. Returns null if not cached.
   * Increments reference count on access.
   */
  get(url: string): BaseTexture | null {
    const entry = this.cache.get(url);
    if (entry) {
      entry.refCount++;
      return entry.texture;
    }
    return null;
  }

  /**
   * Store a texture in the cache with initial refCount of 1.
   * If already cached, increments refCount instead.
   */
  set(url: string, texture: BaseTexture): void {
    const existing = this.cache.get(url);
    if (existing) {
      existing.refCount++;
      return;
    }
    this.cache.set(url, { texture, refCount: 1 });
  }

  /**
   * Release a texture reference. Decrements refCount.
   * When refCount reaches 0, destroys the texture and removes from cache.
   */
  release(url: string): void {
    const entry = this.cache.get(url);
    if (!entry) return;

    entry.refCount--;
    if (entry.refCount <= 0) {
      entry.texture.destroy();
      this.cache.delete(url);
    }
  }

  /**
   * Clear all cached textures, destroying them all.
   */
  clear(): void {
    for (const [, entry] of this.cache) {
      entry.texture.destroy();
    }
    this.cache.clear();
  }

  /**
   * Marks all cached textures as dirty so they get re-uploaded
   * when used in a new WebGL context. Call this after destroying
   * a PixiJS Application that used these textures.
   */
  invalidateForNewContext(): void {
    for (const [, entry] of this.cache) {
      entry.texture.dirtyId++;
      entry.texture.dirtyStyleId++;
    }
  }
}

// Singleton instance shared across all SpineRenderer components
export const textureCache = new TextureCache();

/**
 * Marks all cached textures as dirty so they get re-uploaded
 * when used in a new WebGL context. Call this after destroying
 * a PixiJS Application that used these textures.
 */
export function invalidateTexturesForNewContext(): void {
  textureCache.invalidateForNewContext();
}
