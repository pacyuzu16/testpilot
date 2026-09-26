import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatDate,
  formatDateShort,
  formatTime,
  formatCurrency,
  formatNumber,
  getRelativeTime,
  calculateDuration,
} from '../formatters';

afterEach(() => {
  vi.useRealTimers();
});

describe('formatDate', () => {
  it('formats ISO string with default format', () => {
    const result = formatDate('2099-01-01T09:00:00');
    expect(result).toBe('Jan 01, 2099 09:00');
  });

  it('formats ISO string with custom format', () => {
    const result = formatDate('2099-06-15T14:30:00', 'yyyy/MM/dd');
    expect(result).toBe('2099/06/15');
  });

  it('returns original string for invalid input', () => {
    const result = formatDate('not-a-date');
    expect(result).toBe('not-a-date');
  });
});

describe('formatDateShort', () => {
  it('formats to short date', () => {
    const result = formatDateShort('2099-03-20T00:00:00');
    expect(result).toBe('Mar 20, 2099');
  });
});

describe('formatTime', () => {
  it('formats to HH:mm', () => {
    const result = formatTime('2099-01-01T09:05:00');
    expect(result).toBe('09:05');
  });
});

describe('formatCurrency', () => {
  it('formats integer as USD with no decimals', () => {
    const result = formatCurrency(1000000);
    expect(result).toBe('$1,000,000');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toBe('$0');
  });
});

describe('formatNumber', () => {
  it('formats large number with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('formats small number unchanged', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('getRelativeTime', () => {
  it('returns "just now" for timestamps within 60 seconds', () => {
    vi.useFakeTimers();
    const now = new Date('2099-01-01T12:00:00Z');
    vi.setSystemTime(now);
    const justNow = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(getRelativeTime(justNow)).toBe('just now');
  });

  it('returns "X minutes ago" for timestamps within an hour', () => {
    vi.useFakeTimers();
    const now = new Date('2099-01-01T12:00:00Z');
    vi.setSystemTime(now);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(getRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('returns "X hours ago" for timestamps within a day', () => {
    vi.useFakeTimers();
    const now = new Date('2099-01-01T12:00:00Z');
    vi.setSystemTime(now);
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
    expect(getRelativeTime(twoHoursAgo)).toBe('2 hours ago');
  });

  it('returns "X days ago" for timestamps within 30 days', () => {
    vi.useFakeTimers();
    const now = new Date('2099-01-15T12:00:00Z');
    vi.setSystemTime(now);
    const tenDaysAgo = new Date(now.getTime() - 10 * 86400 * 1000).toISOString();
    expect(getRelativeTime(tenDaysAgo)).toBe('10 days ago');
  });

  it('returns short date for timestamps older than 30 days', () => {
    vi.useFakeTimers();
    const now = new Date('2099-06-01T12:00:00Z');
    vi.setSystemTime(now);
    const oldDate = '2099-01-01T00:00:00Z';
    const result = getRelativeTime(oldDate);
    expect(result).toBe('Jan 01, 2099');
  });

  it('returns original string for invalid input', () => {
    expect(getRelativeTime('bad-date')).toBe('bad-date');
  });
});

describe('calculateDuration', () => {
  it('returns hours for exact-hour durations', () => {
    expect(calculateDuration('2099-01-01T09:00:00Z', '2099-01-01T17:00:00Z')).toBe('8h');
  });

  it('returns hours and minutes for non-exact durations', () => {
    expect(calculateDuration('2099-01-01T09:00:00Z', '2099-01-01T10:30:00Z')).toBe('1h 30m');
  });

  it('returns minutes for sub-hour durations', () => {
    expect(calculateDuration('2099-01-01T09:00:00Z', '2099-01-01T09:45:00Z')).toBe('45 min');
  });

  it('returns N/A for invalid input', () => {
    expect(calculateDuration('bad', 'input')).toBe('N/A');
  });
});
