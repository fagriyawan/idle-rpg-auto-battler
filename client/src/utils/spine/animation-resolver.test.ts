import { describe, it, expect } from 'vitest';
import { resolveAnimation } from './animation-resolver';

describe('AnimationResolver - resolveAnimation', () => {
  it('returns preferred animation when it exists in the list', () => {
    const animations = ['idle', 'walk', 'attack', 'special_move'];
    expect(resolveAnimation(animations, 'special_move')).toBe('special_move');
  });

  it('returns "idle" when present (highest priority)', () => {
    const animations = ['walk', 'wait', 'idle', 'stand', 'attack'];
    expect(resolveAnimation(animations)).toBe('idle');
  });

  it('returns "Idle" when "idle" is not present', () => {
    const animations = ['walk', 'wait', 'Idle', 'stand', 'attack'];
    expect(resolveAnimation(animations)).toBe('Idle');
  });

  it('returns "wait" when no idle variants exist', () => {
    const animations = ['walk', 'wait', 'stand', 'attack'];
    expect(resolveAnimation(animations)).toBe('wait');
  });

  it('returns "stand" when no idle/wait variants exist', () => {
    const animations = ['walk', 'stand', 'attack', 'run'];
    expect(resolveAnimation(animations)).toBe('stand');
  });

  it('falls back to first animation when no idle-like names exist', () => {
    const animations = ['walk', 'attack', 'run', 'jump'];
    expect(resolveAnimation(animations)).toBe('walk');
  });

  it('case-insensitive partial match: finds "IdleLoop" when no exact matches', () => {
    const animations = ['walk', 'IdleLoop', 'attack'];
    expect(resolveAnimation(animations)).toBe('IdleLoop');
  });

  it('returns empty string for empty animation list', () => {
    expect(resolveAnimation([])).toBe('');
  });

  it('preferred animation that does not exist falls through to priority search', () => {
    const animations = ['idle', 'walk', 'attack'];
    expect(resolveAnimation(animations, 'nonexistent')).toBe('idle');
  });
});
