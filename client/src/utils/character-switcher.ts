/**
 * Returns the next hero index, wrapping to the beginning when at the end.
 */
export function getNextHeroIndex(current: number, total: number): number {
  return (current + 1) % total;
}

/**
 * Returns the previous hero index, wrapping to the end when at the beginning.
 */
export function getPreviousHeroIndex(current: number, total: number): number {
  return (current - 1 + total) % total;
}
