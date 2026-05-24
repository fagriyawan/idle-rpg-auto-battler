/**
 * Resolves the best idle animation from a Spine skeleton's available animations.
 *
 * Priority order:
 * 1. If preferredAnimation is provided and exists in skeleton → use it
 * 2. Search for (case-insensitive): "idle", "Idle", "wait", "Wait", "stand", "Stand"
 * 3. Fallback: first animation in the skeleton's animation list
 *
 * @param animationNames - Array of available animation names from the skeleton
 * @param preferredAnimation - Optional preferred animation name
 * @returns A valid animation name that exists in the skeleton
 */
export function resolveAnimation(animationNames: string[], preferredAnimation?: string): string {
  // If preferred animation exists, use it
  if (preferredAnimation && animationNames.includes(preferredAnimation)) {
    return preferredAnimation;
  }

  // Priority search for exact idle-like animation names
  const priorities = ['idle', 'Idle', 'wait', 'Wait', 'stand', 'Stand'];
  for (const name of priorities) {
    if (animationNames.includes(name)) {
      return name;
    }
  }

  // Case-insensitive search for animations containing "idle", "wait", or "stand"
  const lowerNames = animationNames.map((n) => n.toLowerCase());

  const idleIndex = lowerNames.findIndex((n) => n.includes('idle'));
  if (idleIndex !== -1) return animationNames[idleIndex];

  const waitIndex = lowerNames.findIndex((n) => n.includes('wait'));
  if (waitIndex !== -1) return animationNames[waitIndex];

  const standIndex = lowerNames.findIndex((n) => n.includes('stand'));
  if (standIndex !== -1) return animationNames[standIndex];

  // Fallback to first animation
  return animationNames[0] || '';
}
