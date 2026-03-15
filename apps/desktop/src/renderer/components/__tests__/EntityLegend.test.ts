import { describe, expect, it } from 'vitest';
import { getNodeTypeColor, getNodeTypeLabel } from '../EntityLegend';

describe('EntityLegend helpers', () => {
  it('should return correct color for terminal', () => {
    expect(getNodeTypeColor('terminal')).toBe('#0ecf85');
  });

  it('should return correct color for agent', () => {
    expect(getNodeTypeColor('agent')).toBe('#4a9eff');
  });

  it('should return correct color for browser', () => {
    expect(getNodeTypeColor('browser')).toBe('#f5c348');
  });

  it('should return correct color for conversation', () => {
    expect(getNodeTypeColor('conversation')).toBe('#9b59b6');
  });

  it('should return fallback color for unknown type', () => {
    expect(getNodeTypeColor('unknown')).toBe('#666');
  });

  it('should return correct label for terminal', () => {
    expect(getNodeTypeLabel('terminal')).toBe('Terminal');
  });

  it('should return correct label for agent', () => {
    expect(getNodeTypeLabel('agent')).toBe('Agent');
  });

  it('should return correct label for browser', () => {
    expect(getNodeTypeLabel('browser')).toBe('Browser');
  });

  it('should return type string as fallback label', () => {
    expect(getNodeTypeLabel('mystery')).toBe('mystery');
  });
});
