/**
 * Global Spine Asset Cache
 * 
 * Preloads and caches spine skeleton data so that creating Spine display objects
 * is instant (no network fetch needed). Used by both the loading screen and
 * the shared Heroes Panel canvas.
 */

import * as PIXI from 'pixi.js';
import { Spine, TextureAtlas } from 'pixi-spine';
import { SkeletonJson as SkeletonJson37, AtlasAttachmentLoader as AtlasAttachmentLoader37 } from '@pixi-spine/runtime-3.7';
import { SkeletonJson as SkeletonJson38, AtlasAttachmentLoader as AtlasAttachmentLoader38 } from '@pixi-spine/runtime-3.8';
import { textureCache } from './spine/texture-cache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SkeletonData = any;

export interface SpineAssetEntry {
  skeletonData: SkeletonData;
  animationNames: string[];
}

/** Global cache: heroTemplateId → preloaded skeleton data */
const spineAssetCache = new Map<string, SpineAssetEntry>();

/** Check if a hero's spine data is already cached */
export function isSpineCached(heroTemplateId: string): boolean {
  return spineAssetCache.has(heroTemplateId);
}

/** Get cached spine data for a hero */
export function getCachedSpineData(heroTemplateId: string): SpineAssetEntry | undefined {
  return spineAssetCache.get(heroTemplateId);
}

/** Create a Spine display object from cached data (instant, no network) */
export function createSpineFromCache(heroTemplateId: string): Spine | null {
  const entry = spineAssetCache.get(heroTemplateId);
  if (!entry) return null;
  return new Spine(entry.skeletonData);
}

export interface PreloadProgress {
  loaded: number;
  total: number;
  currentHero: string;
}

/**
 * Preload all spine assets for a list of hero template IDs.
 * Parses skeleton data and caches it for instant Spine creation later.
 * Reports progress via callback.
 */
export async function preloadAllSpineAssets(
  heroTemplateIds: string[],
  onProgress?: (progress: PreloadProgress) => void
): Promise<void> {
  const total = heroTemplateIds.length;
  let loaded = 0;

  // Process in batches of 4 to avoid overwhelming the network
  const BATCH_SIZE = 4;

  for (let i = 0; i < heroTemplateIds.length; i += BATCH_SIZE) {
    const batch = heroTemplateIds.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (templateId) => {
        try {
          if (spineAssetCache.has(templateId)) {
            loaded++;
            onProgress?.({ loaded, total, currentHero: templateId });
            return;
          }

          await preloadSingleSpineAsset(templateId);
          loaded++;
          onProgress?.({ loaded, total, currentHero: templateId });
        } catch (err) {
          console.warn(`[SpineAssetCache] Failed to preload ${templateId}:`, err);
          loaded++;
          onProgress?.({ loaded, total, currentHero: templateId });
        }
      })
    );
  }
}

/** Preload a single hero's spine asset into the cache */
async function preloadSingleSpineAsset(templateId: string): Promise<void> {
  const basePath = `/assets/heroes/used_char/${templateId}/${templateId}`;
  const atlasUrl = `${basePath}.atlas`;
  const jsonUrl = `${basePath}.json`;

  // 1. Fetch atlas
  const atlasResp = await fetch(atlasUrl);
  if (!atlasResp.ok) throw new Error(`Atlas fetch failed: ${atlasResp.status}`);
  let atlasText = await atlasResp.text();
  atlasText = atlasText.split('\n').map(l => l.trimEnd()).join('\n');

  // 2. Parse atlas with texture loading
  const atlasBasePath = atlasUrl.substring(0, atlasUrl.lastIndexOf('/') + 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const atlas = await new Promise<any>((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (TextureAtlas as any)(atlasText, (pageName: string, callback: (tex: PIXI.BaseTexture) => void) => {
        const imgUrl = atlasBasePath + pageName;
        const cached = textureCache.get(imgUrl);
        if (cached) { callback(cached); return; }

        const tex = PIXI.BaseTexture.from(imgUrl, { scaleMode: PIXI.SCALE_MODES.LINEAR });
        textureCache.set(imgUrl, tex);
        if (tex.valid) {
          callback(tex);
        } else {
          tex.once('loaded', () => callback(tex));
          tex.once('error', () => reject(new Error(`Texture failed: ${pageName}`)));
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, (result: any) => {
        if (result) resolve(result);
        else reject(new Error('Atlas parse failed'));
      });
    } catch (e) {
      reject(e);
    }
  });

  // 3. Load skeleton JSON
  const jsonResp = await fetch(jsonUrl);
  if (!jsonResp.ok) throw new Error(`JSON fetch failed: ${jsonResp.status}`);
  const jsonData = await jsonResp.json();

  const jsonVersion = jsonData?.skeleton?.spine || '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let skeletonData: any;

  if (jsonVersion.startsWith('3.8') || jsonVersion.startsWith('3.9') || jsonVersion.startsWith('4.')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parser = new SkeletonJson38(new AtlasAttachmentLoader38(atlas) as any);
    parser.scale = 1;
    skeletonData = parser.readSkeletonData(jsonData);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parser = new SkeletonJson37(new AtlasAttachmentLoader37(atlas) as any);
    parser.scale = 1;
    skeletonData = parser.readSkeletonData(jsonData);
  }

  // 4. Extract animation names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animationNames: string[] = skeletonData.animations.map((a: any) => a.name);

  // 5. Cache it
  spineAssetCache.set(templateId, { skeletonData, animationNames });
}

/** Clear the entire cache (for cleanup) */
export function clearSpineAssetCache(): void {
  spineAssetCache.clear();
}
