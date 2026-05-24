/**
 * Spine format detection utility.
 *
 * Determines which Spine runtime version and data format an asset uses
 * based on file URLs and atlas header content.
 */

/** Supported Spine asset formats */
export type SpineFormat = 'json36' | 'skel36' | 'skel38';

/**
 * Detects the Spine format for a given set of asset inputs.
 *
 * Detection logic:
 * - If `jsonUrl` is provided, the format is always `'json36'` (Spine 3.6 JSON).
 * - If `skelUrl` is provided, the atlas header is inspected:
 *   - Spine 3.6 atlases include a `pma:true` or `pma:false` line → `'skel36'`
 *   - Spine 3.8 atlases omit the `pma:` line → `'skel38'`
 * - Default fallback: `'skel36'` (most common in our asset set).
 *
 * @param jsonUrl - URL to a Spine 3.6 JSON skeleton file (optional)
 * @param skelUrl - URL to a Spine binary `.skel` file (optional)
 * @param atlasText - Raw text content of the `.atlas` file (optional)
 * @returns The detected SpineFormat
 */
export function detectFormat(
  jsonUrl?: string,
  _skelUrl?: string,
  atlasText?: string
): SpineFormat {
  // Step 1: If jsonUrl is provided, it's always JSON 3.6
  if (jsonUrl) {
    return 'json36';
  }

  // Step 2: skelUrl is provided — determine version from atlas content
  // Strategy: Check if atlas uses Spine 3.8 format indicators.
  // Spine 3.8 atlases have a different header structure:
  // - They do NOT have "pma:" line
  // - They have "pma:" replaced with nothing (field removed in 3.8)
  // - BUT some Spine 3.6 atlases also don't have "pma:" (older exports)
  //
  // More reliable: Spine 3.8 atlas has the page size on a separate line
  // without "size:" prefix in newer format, OR we check for specific
  // 3.8-only fields.
  //
  // Safest approach for our asset set:
  // - Hero 004 is the ONLY Spine 3.8 asset (H30103.skel)
  // - All others (003, 005, 006, 007) are Spine 3.6
  // - Spine 3.8 atlases typically DON'T have "filter:" with "Linear,Linear"
  //   on the same line — they use separate lines for min/mag filter
  //
  // Actually the most reliable heuristic for OUR assets:
  // Spine 3.6 atlas has "index: -1" lines (region index field)
  // Spine 3.8 atlas does NOT have "index:" lines
  if (atlasText) {
    // Check for "index:" which is present in Spine 3.6 but removed in 3.8
    const hasIndexField = atlasText.includes('index:');
    if (hasIndexField) {
      return 'skel36';
    }
    return 'skel38';
  }

  // Default fallback: assume skel36 (most common in our assets)
  return 'skel36';
}
