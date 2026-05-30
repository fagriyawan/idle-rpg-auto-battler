import { describe, it, expect } from 'vitest';
import { validateFormation } from './FormationPanel';

describe('FormationPanel - validateFormation', () => {
  it('returns null for a valid formation with 1 hero', () => {
    const result = validateFormation(['hero-1']);
    expect(result).toBeNull();
  });

  it('returns null for a valid formation with 5 heroes', () => {
    const result = validateFormation(['hero-1', 'hero-2', 'hero-3', 'hero-4', 'hero-5']);
    expect(result).toBeNull();
  });

  it('returns error for empty formation', () => {
    const result = validateFormation([]);
    expect(result).toBe('Formation must contain at least 1 hero.');
  });

  it('returns error for formation exceeding 5 heroes', () => {
    const result = validateFormation(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
    expect(result).toContain('cannot exceed 5 heroes');
  });

  it('returns error for formation with duplicate hero IDs', () => {
    const result = validateFormation(['hero-1', 'hero-2', 'hero-1']);
    expect(result).toContain('duplicate');
  });

  it('returns null for formation with 3 unique heroes', () => {
    const result = validateFormation(['a', 'b', 'c']);
    expect(result).toBeNull();
  });
});
