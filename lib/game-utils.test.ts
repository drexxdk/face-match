/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  generateGameCode,
  deletePersonImage,
  endGameSession,
  getRandomIcebreakerTip,
  formatTime,
  formatScorePercentage,
  truncate,
  getInitials,
  ICEBREAKER_TIPS,
} from './game-utils';

describe('game-utils', () => {
  describe('generateGameCode', () => {
    it('generates code with default length of 6', () => {
      const code = generateGameCode();
      expect(code).toHaveLength(6);
    });

    it('generates code with custom length', () => {
      const code = generateGameCode(8);
      expect(code).toHaveLength(8);
    });

    it('only uses allowed characters (no ambiguous ones)', () => {
      const code = generateGameCode(100); // Generate long code for better testing
      const allowedChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
      expect(code).toMatch(allowedChars);
      // Should not contain ambiguous characters
      expect(code).not.toMatch(/[0O1I]/);
    });

    it('generates different codes each time', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateGameCode());
      }
      // With random generation, we should get mostly unique codes
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('deletePersonImage', () => {
    const mockSupabase = {
      storage: {
        from: jest.fn(),
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns success when imageUrl is null', async () => {
      const result = await deletePersonImage(mockSupabase as any, null);
      expect(result).toEqual({ success: true });
      expect(mockSupabase.storage.from).not.toHaveBeenCalled();
    });

    it('returns success when imageUrl is empty string', async () => {
      const result = await deletePersonImage(mockSupabase as any, '');
      expect(result).toEqual({ success: true });
    });

    it('deletes image successfully', async () => {
      const mockRemove = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.storage.from.mockReturnValue({
        remove: mockRemove,
      });

      const imageUrl = 'https://example.com/storage/v1/object/public/person-images/test.jpg';
      const result = await deletePersonImage(mockSupabase as any, imageUrl);

      expect(result).toEqual({ success: true });
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('person-images');
      expect(mockRemove).toHaveBeenCalledWith(['test.jpg']);
    });

    it('handles URL-encoded filenames', async () => {
      const mockRemove = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.storage.from.mockReturnValue({
        remove: mockRemove,
      });

      const imageUrl = 'https://example.com/storage/v1/object/public/person-images/test%20file.jpg';
      await deletePersonImage(mockSupabase as any, imageUrl);

      expect(mockRemove).toHaveBeenCalledWith(['test file.jpg']);
    });

    it('returns error when URL format is invalid', async () => {
      const imageUrl = 'https://example.com/invalid-url';
      const result = await deletePersonImage(mockSupabase as any, imageUrl);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Could not extract filename from URL');
    });

    it('returns error when storage deletion fails', async () => {
      const mockRemove = jest.fn().mockResolvedValue({
        error: { message: 'Storage error' },
      });
      mockSupabase.storage.from.mockReturnValue({
        remove: mockRemove,
      });

      const imageUrl = 'https://example.com/storage/v1/object/public/person-images/test.jpg';
      const result = await deletePersonImage(mockSupabase as any, imageUrl);

      expect(result).toEqual({ success: false, error: 'Storage error' });
    });

    it('handles exceptions gracefully', async () => {
      mockSupabase.storage.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      const imageUrl = 'https://example.com/storage/v1/object/public/person-images/test.jpg';
      const result = await deletePersonImage(mockSupabase as any, imageUrl);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('endGameSession', () => {
    const mockSupabase = {
      from: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('ends game session successfully', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const result = await endGameSession(mockSupabase as any, 'session-123');

      expect(result).toEqual({ success: true });
      expect(mockSupabase.from).toHaveBeenCalledWith('game_sessions');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'completed' });
      expect(mockEq).toHaveBeenCalledWith('id', 'session-123');
    });

    it('returns error when update fails', async () => {
      const mockEq = jest.fn().mockResolvedValue({
        error: { message: 'Database error' },
      });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      const result = await endGameSession(mockSupabase as any, 'session-123');

      expect(result).toEqual({ success: false, error: 'Database error' });
    });
  });

  describe('getRandomIcebreakerTip', () => {
    it('returns a tip from ICEBREAKER_TIPS array', () => {
      const tip = getRandomIcebreakerTip();
      expect(ICEBREAKER_TIPS).toContain(tip);
    });

    it('returns different tips on multiple calls', () => {
      const tips = new Set();
      for (let i = 0; i < 50; i++) {
        tips.add(getRandomIcebreakerTip());
      }
      // Should get some variety (at least 3 different tips in 50 calls)
      expect(tips.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('formatTime', () => {
    it('formats seconds to MM:SS', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(125)).toBe('2:05');
    });

    it('handles large numbers', () => {
      expect(formatTime(3600)).toBe('60:00');
      expect(formatTime(3665)).toBe('61:05');
    });

    it('pads seconds with zero', () => {
      expect(formatTime(5)).toBe('0:05');
      expect(formatTime(65)).toBe('1:05');
    });
  });

  describe('formatScorePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(formatScorePercentage(5, 10)).toBe('50%');
      expect(formatScorePercentage(7, 10)).toBe('70%');
      expect(formatScorePercentage(10, 10)).toBe('100%');
    });

    it('rounds to nearest integer', () => {
      expect(formatScorePercentage(1, 3)).toBe('33%');
      expect(formatScorePercentage(2, 3)).toBe('67%');
    });

    it('handles zero total', () => {
      expect(formatScorePercentage(5, 0)).toBe('0%');
    });

    it('handles zero score', () => {
      expect(formatScorePercentage(0, 10)).toBe('0%');
    });

    it('handles perfect score', () => {
      expect(formatScorePercentage(25, 25)).toBe('100%');
    });
  });

  describe('truncate', () => {
    it('truncates long text with ellipsis', () => {
      expect(truncate('This is a long text', 10)).toBe('This is...');
    });

    it('does not truncate short text', () => {
      expect(truncate('Short', 10)).toBe('Short');
    });

    it('handles exact length', () => {
      expect(truncate('Exactly10!', 10)).toBe('Exactly10!');
    });

    it('handles empty string', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('accounts for ellipsis in max length', () => {
      const result = truncate('Hello World', 8);
      expect(result).toHaveLength(8);
      expect(result).toBe('Hello...');
    });
  });

  describe('getInitials', () => {
    it('returns initials from first and last name', () => {
      expect(getInitials('John', 'Doe')).toBe('JD');
      expect(getInitials('Jane', 'Smith')).toBe('JS');
    });

    it('handles lowercase names', () => {
      expect(getInitials('john', 'doe')).toBe('JD');
    });

    it('handles null first name', () => {
      expect(getInitials(null, 'Doe')).toBe('D');
    });

    it('handles null last name', () => {
      expect(getInitials('John', null)).toBe('J');
    });

    it('handles undefined names', () => {
      expect(getInitials(undefined, 'Doe')).toBe('D');
      expect(getInitials('John', undefined)).toBe('J');
    });

    it('handles both names null or empty', () => {
      expect(getInitials(null, null)).toBe('?');
      expect(getInitials('', '')).toBe('?');
      expect(getInitials(undefined, undefined)).toBe('?');
    });

    it('handles single character names', () => {
      expect(getInitials('A', 'B')).toBe('AB');
    });
  });
});
