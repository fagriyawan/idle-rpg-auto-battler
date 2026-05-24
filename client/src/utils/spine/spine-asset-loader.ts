/**
 * Spine Asset Loader — based on reference implementation pattern
 * https://github.com/fagriyawan/fagriyawan.github.io/tree/feat/battle-system
 */

import * as PIXI from 'pixi.js';
import { Spine, TextureAtlas } from 'pixi-spine';
import { SkeletonJson as SkeletonJson37, AtlasAttachmentLoader as AtlasAttachmentLoader37 } from '@pixi-spine/runtime-3.7';
import { SkeletonJson as SkeletonJson38, SkeletonBinary as SkeletonBinary38, AtlasAttachmentLoader as AtlasAttachmentLoader38 } from '@pixi-spine/runtime-3.8';

import { convertSkel36ToJson } from './skel36-converter';
import { resolveAnimation } from './animation-resolver';
import { textureCache } from './texture-cache';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SpineAssetConfig {
  jsonUrl?: string;
  skelUrl?: string;
  atlasUrl: string;
  animation?: string;
}

export interface SpineLoadResult {
  spine: Spine;
  animationName: string;
}

export interface SpineLoadError {
  type: 'network' | 'parse' | 'format' | 'webgl';
  message: string;
  url?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createLoadError(type: SpineLoadError['type'], message: string, url?: string): SpineLoadError {
  return { type, message, url };
}

function readSkelVersion(bytes: Uint8Array): string {
  let pos = 0;
  function readVarint(): number {
    let b = bytes[pos++]; let result = b & 0x7f;
    if ((b & 0x80) !== 0) { b = bytes[pos++]; result |= (b & 0x7f) << 7;
      if ((b & 0x80) !== 0) { b = bytes[pos++]; result |= (b & 0x7f) << 14;
        if ((b & 0x80) !== 0) { b = bytes[pos++]; result |= (b & 0x7f) << 21;
          if ((b & 0x80) !== 0) { b = bytes[pos++]; result |= (b & 0x7f) << 28; }
        }
      }
    }
    return result;
  }
  function readString(): string {
    let n = readVarint(); if (n <= 1) return ''; n--;
    const s = bytes.slice(pos, pos + n); pos += n;
    return new TextDecoder().decode(s);
  }
  try { readString(); return readString(); } catch { return ''; }
}

// ─── Main Loader ─────────────────────────────────────────────────────────────

export async function loadSpineAsset(
  config: SpineAssetConfig,
  signal?: AbortSignal
): Promise<SpineLoadResult> {
  // 1. Fetch atlas text and clean trailing spaces
  const resp1 = await fetch(config.atlasUrl, { signal });
  if (!resp1.ok) throw createLoadError('network', `Atlas fetch failed: ${resp1.status}`, config.atlasUrl);
  let atlasText = await resp1.text();
  atlasText = atlasText.split('\n').map(l => l.trimEnd()).join('\n');

  // 2. Parse atlas with texture loading
  const basePath = config.atlasUrl.substring(0, config.atlasUrl.lastIndexOf('/') + 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const atlas = await new Promise<any>((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (TextureAtlas as any)(atlasText, (pageName: string, callback: (tex: PIXI.BaseTexture) => void) => {
        const imgUrl = basePath + pageName;
        const cached = textureCache.get(imgUrl);
        if (cached) { callback(cached); return; }

        const tex = PIXI.BaseTexture.from(imgUrl, { scaleMode: PIXI.SCALE_MODES.LINEAR });
        textureCache.set(imgUrl, tex);
        if (tex.valid) {
          callback(tex);
        } else {
          tex.once('loaded', () => callback(tex));
          tex.once('error', () => reject(createLoadError('network', `Texture failed: ${pageName}`, imgUrl)));
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, (result: any) => {
        if (result) resolve(result);
        else reject(createLoadError('parse', 'Atlas parse failed', config.atlasUrl));
      });
    } catch (e) {
      reject(createLoadError('parse', `Atlas error: ${e instanceof Error ? e.message : String(e)}`, config.atlasUrl));
    }
  });

  // 3. Load skeleton data based on format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let skeletonData: any;

  if (config.jsonUrl) {
    // JSON format — detect version from skeleton.spine field
    const resp = await fetch(config.jsonUrl, { signal });
    if (!resp.ok) throw createLoadError('network', `JSON fetch failed: ${resp.status}`, config.jsonUrl);
    const jsonData = await resp.json();

    // Check version from JSON data
    const jsonVersion = jsonData?.skeleton?.spine || '';

    if (jsonVersion.startsWith('3.8') || jsonVersion.startsWith('3.9') || jsonVersion.startsWith('4.')) {
      // Spine 3.8+ JSON — use runtime-3.8
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parser = new SkeletonJson38(new AtlasAttachmentLoader38(atlas) as any);
      parser.scale = 1;
      skeletonData = parser.readSkeletonData(jsonData);
    } else {
      // Spine 3.6/3.7 JSON — use runtime-3.7
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parser = new SkeletonJson37(new AtlasAttachmentLoader37(atlas) as any);
      parser.scale = 1;
      skeletonData = parser.readSkeletonData(jsonData);
    }

  } else if (config.skelUrl) {
    // Binary — fetch and detect version
    const resp = await fetch(config.skelUrl, { signal });
    if (!resp.ok) throw createLoadError('network', `Skel fetch failed: ${resp.status}`, config.skelUrl);
    const buffer = await resp.arrayBuffer();
    const version = readSkelVersion(new Uint8Array(buffer));

    if (version.startsWith('3.8') || version.startsWith('3.9') || version.startsWith('4.')) {
      // Spine 3.8 binary — use native binary parser
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parser = new SkeletonBinary38(new AtlasAttachmentLoader38(atlas) as any);
      parser.scale = 1;
      skeletonData = parser.readSkeletonData(new Uint8Array(buffer));
    } else {
      // Spine 3.6 binary — convert to JSON, then parse
      const jsonData = convertSkel36ToJson(buffer);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parser = new SkeletonJson37(new AtlasAttachmentLoader37(atlas) as any);
      parser.scale = 1;
      try {
        skeletonData = parser.readSkeletonData(jsonData);
      } catch (e) {
        console.error('[SpineAssetLoader] skel36 parse error:', e);
        throw createLoadError('parse', `skel36 parse failed: ${e instanceof Error ? e.message : String(e)}`, config.skelUrl);
      }
    }
  } else {
    throw createLoadError('format', 'Either jsonUrl or skelUrl must be provided');
  }

  // 4. Create Spine display object
  const spine = new Spine(skeletonData);

  // 5. Resolve animation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animNames = skeletonData.animations.map((a: any) => a.name);
  const animationName = resolveAnimation(animNames, config.animation);

  return { spine, animationName };
}
