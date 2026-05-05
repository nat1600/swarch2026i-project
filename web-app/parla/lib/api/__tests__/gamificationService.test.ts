import gamificationApiClient from '../gamificationApiClient';
import {
  getUserStreak,
  registerUserActivity,
  saveGameSession,
  getAllUserGameSessions,
  computeTotalXP,
  computeWeeklyActivity,
  incrementScore,
  getLeaderBoard,
  getUserRank,
} from '../gamificationService';

// Mock axios client
jest.mock('../gamificationApiClient');
const mockedClient = gamificationApiClient as jest.Mocked<typeof gamificationApiClient>;

describe('gamificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getUserStreak ─────────────────────────────────────────────────────────
  describe('getUserStreak', () => {
    it('returns UserStreakDTO on success', async () => {
      mockedClient.get = jest.fn().mockResolvedValue({
        data: { currentStreak: 5, longestStreak: 10 },
      });

      const result = await getUserStreak('auth0|testuser');

      expect(mockedClient.get).toHaveBeenCalledWith('/userStreak/getUserStreakData', {
        params: { userName: 'auth0|testuser' },
      });
      expect(result).toEqual({ currentStreak: 5, longestStreak: 10 });
    });

    it('returns null on error', async () => {
      mockedClient.get = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await getUserStreak('auth0|testuser');
      expect(result).toBeNull();
    });
  });

  // ─── registerUserActivity ──────────────────────────────────────────────────
  describe('registerUserActivity', () => {
    it('posts to the correct endpoint and returns updated streak', async () => {
      mockedClient.post = jest.fn().mockResolvedValue({
        data: { currentStreak: 6, longestStreak: 10 },
      });

      const result = await registerUserActivity('auth0|testuser');

      expect(mockedClient.post).toHaveBeenCalledWith(
        '/userStreak/postUserActivity',
        null,
        { params: { userName: 'auth0|testuser' } }
      );
      expect(result).toEqual({ currentStreak: 6, longestStreak: 10 });
    });

    it('returns null on error', async () => {
      mockedClient.post = jest.fn().mockRejectedValue(new Error('Server error'));

      const result = await registerUserActivity('auth0|testuser');
      expect(result).toBeNull();
    });
  });

  // ─── saveGameSession ───────────────────────────────────────────────────────
  describe('saveGameSession', () => {
    it('posts a session with today date if not provided', async () => {
      const today = new Date().toISOString().split('T')[0];
      const payload = { userName: 'auth0|testuser', gamePlayed: 'word-match', points: 150 };
      mockedClient.post = jest.fn().mockResolvedValue({ data: { ...payload, sessionDate: today } });

      const result = await saveGameSession(payload);

      expect(mockedClient.post).toHaveBeenCalledWith(
        '/userGameSession/saveGameSession',
        expect.objectContaining({ sessionDate: today, ...payload })
      );
      expect(result?.gamePlayed).toBe('word-match');
    });

    it('returns null on error', async () => {
      mockedClient.post = jest.fn().mockRejectedValue(new Error('fail'));

      const result = await saveGameSession({
        userName: 'auth0|testuser',
        gamePlayed: 'typing',
        points: 40,
      });
      expect(result).toBeNull();
    });
  });

  // ─── getAllUserGameSessions ────────────────────────────────────────────────
  describe('getAllUserGameSessions', () => {
    it('fetches all sessions for a user', async () => {
      const sessions = [
        { userName: 'auth0|testuser', gamePlayed: 'word-match', points: 100, sessionDate: '2026-03-17' },
      ];
      mockedClient.get = jest.fn().mockResolvedValue({ data: sessions });

      const result = await getAllUserGameSessions('auth0|testuser');

      expect(mockedClient.get).toHaveBeenCalledWith('/userGameSession/getAllUserGameSessions', {
        params: { userName: 'auth0|testuser' },
      });
      expect(result).toHaveLength(1);
    });

    it('returns empty array on error', async () => {
      mockedClient.get = jest.fn().mockRejectedValue(new Error('fail'));

      const result = await getAllUserGameSessions('auth0|testuser');
      expect(result).toEqual([]);
    });
  });

  // ─── computeTotalXP ───────────────────────────────────────────────────────
  describe('computeTotalXP', () => {
    it('sums points from all sessions', () => {
      const sessions = [
        { userName: 'u', gamePlayed: 'word-match', points: 150, sessionDate: '2026-03-10' },
        { userName: 'u', gamePlayed: 'typing', points: 80, sessionDate: '2026-03-11' },
      ];
      expect(computeTotalXP(sessions)).toBe(230);
    });

    it('returns 0 for empty sessions', () => {
      expect(computeTotalXP([])).toBe(0);
    });
  });

  // ─── computeWeeklyActivity ────────────────────────────────────────────────
  describe('computeWeeklyActivity', () => {
    it('returns 7 days', () => {
      const result = computeWeeklyActivity([]);
      expect(result).toHaveLength(7);
    });

    it('adds 10 minutes per session on a matching day', () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const mondayLabel = monday.toISOString().split('T')[0];

      const sessions = [
        { userName: 'u', gamePlayed: 'fill-in-the-word', points: 100, sessionDate: mondayLabel },
        { userName: 'u', gamePlayed: 'stopwatch', points: 50, sessionDate: mondayLabel },
      ];

      const result = computeWeeklyActivity(sessions);
      const mondayEntry = result.find(
        (_, i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          return d.toISOString().split('T')[0] === mondayLabel;
        }
      );
      expect(mondayEntry?.minutes).toBe(20);
    });
  });

  // ─── incrementScore ───────────────────────────────────────────────────────
  describe('incrementScore', () => {
    it('posts to the correct endpoint with userId header and newExp param', async () => {
      mockedClient.post = jest.fn().mockResolvedValue({ data: null });

      await incrementScore('auth0|testuser', 150);

      expect(mockedClient.post).toHaveBeenCalledWith(
        '/leaderBoard/incrementScore',
        null,
        expect.objectContaining({
          params: { newExp: 150 },
          headers: expect.objectContaining({ userId: 'auth0|testuser' }),
        })
      );
    });

    it('does not throw on error (swallows silently)', async () => {
      mockedClient.post = jest.fn().mockRejectedValue(new Error('Network error'));
      await expect(incrementScore('auth0|testuser', 100)).resolves.toBeUndefined();
    });
  });

  // ─── getLeaderBoard ───────────────────────────────────────────────────────
  describe('getLeaderBoard', () => {
    it('fetches the leaderboard and returns ranked users', async () => {
      const board = [
        { userId: 'user1', score: 500, rank: 1 },
        { userId: 'user2', score: 300, rank: 2 },
      ];
      mockedClient.get = jest.fn().mockResolvedValue({ data: board });

      const result = await getLeaderBoard();

      expect(mockedClient.get).toHaveBeenCalledWith('/leaderBoard/getLeaderBoard');
      expect(result).toHaveLength(2);
      expect(result[0].score).toBe(500);
    });

    it('returns empty array on error', async () => {
      mockedClient.get = jest.fn().mockRejectedValue(new Error('fail'));
      const result = await getLeaderBoard();
      expect(result).toEqual([]);
    });

    it('returns empty array when response data is null', async () => {
      mockedClient.get = jest.fn().mockResolvedValue({ data: null });
      const result = await getLeaderBoard();
      expect(result).toEqual([]);
    });
  });

  // ─── getUserRank ──────────────────────────────────────────────────────────
  describe('getUserRank', () => {
    it('fetches rank for a specific user with correct header', async () => {
      const rankData = { userId: 'auth0|testuser', score: 250, rank: 3 };
      mockedClient.get = jest.fn().mockResolvedValue({ data: rankData });

      const result = await getUserRank('auth0|testuser');

      expect(mockedClient.get).toHaveBeenCalledWith(
        '/leaderBoard/getUserRank',
        expect.objectContaining({
          headers: expect.objectContaining({ userName: 'auth0|testuser' }),
        })
      );
      expect(result?.score).toBe(250);
      expect(result?.rank).toBe(3);
    });

    it('returns null on error', async () => {
      mockedClient.get = jest.fn().mockRejectedValue(new Error('fail'));
      const result = await getUserRank('auth0|testuser');
      expect(result).toBeNull();
    });
  });

});
