import { describe, expect, it } from 'vitest';
import { formatLogTimestamp } from '../SystemLog';

describe('SystemLog helpers', () => {
  it('should format timestamp as HH:MM:SS.mmm', () => {
    const ts = new Date(2026, 2, 15, 10, 30, 45, 123).getTime();
    const result = formatLogTimestamp(ts);
    expect(result).toBe('10:30:45.123');
  });

  it('should pad single digits', () => {
    const ts = new Date(2026, 0, 1, 5, 3, 7, 9).getTime();
    const result = formatLogTimestamp(ts);
    expect(result).toBe('05:03:07.009');
  });

  it('should handle midnight', () => {
    const ts = new Date(2026, 0, 1, 0, 0, 0, 0).getTime();
    const result = formatLogTimestamp(ts);
    expect(result).toBe('00:00:00.000');
  });
});
