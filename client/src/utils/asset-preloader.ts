/**
 * Preloads spine assets (JSON, atlas, PNG) for a list of hero template IDs.
 * Uses fetch() to warm the browser cache. Runs in background without blocking UI.
 */

const PRELOAD_CONCURRENCY = 3; // Load 3 heroes at a time to avoid overwhelming the network

export async function preloadHeroAssets(heroTemplateIds: string[]): Promise<void> {
  // Process in batches of PRELOAD_CONCURRENCY
  for (let i = 0; i < heroTemplateIds.length; i += PRELOAD_CONCURRENCY) {
    const batch = heroTemplateIds.slice(i, i + PRELOAD_CONCURRENCY);
    await Promise.all(batch.map(preloadSingleHero));
  }
}

async function preloadSingleHero(templateId: string): Promise<void> {
  const basePath = `/assets/heroes/used_char/${templateId}/${templateId}`;

  try {
    await Promise.all([
      fetch(`${basePath}.json`).then((r) => r.text()), // Cache the JSON
      fetch(`${basePath}.atlas`).then((r) => r.text()), // Cache the atlas
      // PNG will be loaded by the browser when atlas references it
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Don't fail on error
        img.src = `${basePath}.png`;
      }),
    ]);
  } catch {
    // Silently ignore preload failures
  }
}

/**
 * Returns the list of all known hero template IDs for preloading.
 */
export function getAllHeroTemplateIds(): string[] {
  return [
    '108111', '113231', '121231', '122031', '123011',
    '124111', '124211', '124511', '126031', '126111',
    '126231', '126411', '126911', '127631', '127811',
    '128411', '129311', '129411', '129511', '129911',
    '130111', '130931', '131231', '131611', '131731',
    '131811', '132031',
  ];
}
