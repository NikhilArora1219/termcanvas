import { describe, expect, it } from 'vitest';
import { getViewModeLabel, getViewModes } from '../HeaderBar';

describe('HeaderBar helpers', () => {
  it('should return 3 view modes', () => {
    expect(getViewModes()).toEqual(['canvas', 'split', 'focus']);
  });

  it('should return correct label for canvas', () => {
    expect(getViewModeLabel('canvas')).toBe('Canvas');
  });

  it('should return correct label for split', () => {
    expect(getViewModeLabel('split')).toBe('Split');
  });

  it('should return correct label for focus', () => {
    expect(getViewModeLabel('focus')).toBe('Focus');
  });
});
