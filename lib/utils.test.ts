import { cn, isValidEmail, formatDate, formatDateTime, formatNumber, capitalize, sleep } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });

    it('handles conditional classes', () => {
      expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
    });

    it('handles Tailwind merge conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('handles arrays and objects', () => {
      expect(cn(['text-sm', 'font-bold'], { hidden: false, block: true })).toBe('text-sm font-bold block');
    });
  });

  describe('isValidEmail', () => {
    it('validates correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('test123@test.org')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('formats Date objects correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan/);
      expect(formatted).toMatch(/15/);
      expect(formatted).toMatch(/2024/);
    });

    it('formats date strings correctly', () => {
      const formatted = formatDate('2024-12-25');
      expect(formatted).toMatch(/Dec/);
      expect(formatted).toMatch(/25/);
      expect(formatted).toMatch(/2024/);
    });
  });

  describe('formatDateTime', () => {
    it('formats Date objects with time', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/Jan/);
      expect(formatted).toMatch(/15/);
      expect(formatted).toMatch(/2024/);
      // Time format may vary by locale (colon or dot separator)
      expect(formatted).toMatch(/\d+[:.\s]\d+/);
    });

    it('formats date strings with time', () => {
      const formatted = formatDateTime('2024-12-25T18:45:00Z');
      expect(formatted).toMatch(/Dec/);
      expect(formatted).toMatch(/25/);
      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/\d+[:.\s]\d+/);
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1000)).toMatch(/1[,\s.]000/);
      expect(formatNumber(1234567)).toMatch(/1[,\s.]234[,\s.]567/);
    });

    it('handles small numbers', () => {
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(0)).toBe('0');
    });

    it('handles negative numbers', () => {
      const formatted = formatNumber(-5000);
      expect(formatted).toContain('5');
      expect(formatted).toContain('000');
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('handles already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });

    it('handles single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('handles empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('only capitalizes first letter', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });
  });

  describe('sleep', () => {
    it('delays execution for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some margin
    });

    it('resolves without value', async () => {
      const result = await sleep(10);
      expect(result).toBeUndefined();
    });
  });
});
