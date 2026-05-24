/**
 * Spine Atlas Parser
 *
 * Parses Spine atlas text files (3.6/3.8 format) and extracts
 * texture page filenames needed for loading.
 *
 * Atlas format:
 * A new texture page starts when a line matches a `.png` filename pattern
 * (no leading whitespace, ends with `.png`, does not contain a colon).
 *
 * Example (hero 004 multi-page atlas):
 *   Returns ['H30103.png', 'H301032.png'] — both textures
 *   are loaded and associated with the atlas.
 */

/**
 * Extracts texture page filenames from a Spine atlas text file.
 *
 * Texture page declarations are lines that:
 * - End with `.png`
 * - Have no leading whitespace (they start at column 0)
 * - Do not contain a colon (distinguishing them from metadata like `size:`, `filter:`)
 *
 * @param atlasText - The raw text content of a `.atlas` file
 * @returns An array of texture page filenames (e.g. `['H30103.png', 'H301032.png']`)
 */
export function parseAtlasPages(atlasText: string): string[] {
  const pages: string[] = [];
  const lines = atlasText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length > 0 &&
      trimmed.endsWith('.png') &&
      !trimmed.includes(':') &&
      !line.startsWith(' ') &&
      !line.startsWith('\t')
    ) {
      pages.push(trimmed);
    }
  }

  return pages;
}
