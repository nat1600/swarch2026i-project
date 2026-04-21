// Typed helpers for the Gamification Service REST API
import gamificationApiClient from './gamificationApiClient';

// ─── DTOs (mirrors the Spring Boot DTOs) ─────────────────────────────────────

export interface UserStreakDTO {
  currentStreak: number;
  longestStreak: number;
}

export interface UserGameSessionDTO {
  userName: string;
  gamePlayed: string;
  points: number;
  /** ISO date string, e.g. "2026-03-17" */
  sessionDate: string;
}

// ─── Streak endpoints ─────────────────────────────────────────────────────────

/**
 * Fetch the current streak data for a user.
 * GET /userStreak/getUserStreakData?userName=
 *
 * Returns null if the user has no activity recorded yet.
 */
export async function getUserStreak(userName: string): Promise<UserStreakDTO | null> {
  try {
    const response = await gamificationApiClient.get<UserStreakDTO>(
      '/userStreak/getUserStreakData',
      { params: { userName } }
    );
    return response.data;
  } catch (error) {
    console.error('getUserStreak failed:', error);
    return null;
  }
}

/**
 * Register today's activity for a user (updates streak).
 * POST /userStreak/postUserActivity?userName=
 *
 * Returns the updated streak, or null on failure.
 */
export async function registerUserActivity(userName: string): Promise<UserStreakDTO | null> {
  try {
    const response = await gamificationApiClient.post<UserStreakDTO>(
      '/userStreak/postUserActivity',
      null,
      { params: { userName } }
    );
    return response.data;
  } catch (error) {
    console.error('registerUserActivity failed:', error);
    return null;
  }
}

// ─── Game session endpoints ───────────────────────────────────────────────────

/**
 * Save a game session (XP points earned in a game).
 * POST /userGameSession/saveGameSession
 *
 * The sessionDate is automatically set to today's ISO date if not provided.
 */
export async function saveGameSession(
  dto: Omit<UserGameSessionDTO, 'sessionDate'> & { sessionDate?: string }
): Promise<UserGameSessionDTO | null> {
  try {
    const payload: UserGameSessionDTO = {
      sessionDate: new Date().toISOString().split('T')[0], // "YYYY-MM-DD"
      ...dto,
    };
    const response = await gamificationApiClient.post<UserGameSessionDTO>(
      '/userGameSession/saveGameSession',
      payload
    );
    return response.data;
  } catch (error) {
    console.error('saveGameSession failed:', error);
    return null;
  }
}

/**
 * Get all game sessions for a user.
 * GET /userGameSession/getAllUserGameSessions?userName=
 *
 * Useful to compute total XP and derive weekly activity.
 */
export async function getAllUserGameSessions(userName: string): Promise<UserGameSessionDTO[]> {
  try {
    const response = await gamificationApiClient.get<UserGameSessionDTO[]>(
      '/userGameSession/getAllUserGameSessions',
      { params: { userName } }
    );
    return response.data ?? [];
  } catch (error) {
    console.error('getAllUserGameSessions failed:', error);
    return [];
  }
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

/**
 * Sum all points from a user's game sessions to get their total XP.
 */
export function computeTotalXP(sessions: UserGameSessionDTO[]): number {
  return sessions.reduce((acc, s) => acc + (s.points ?? 0), 0);
}

/**
 * Aggregate minutes of activity per day-of-week label for the current week.
 * Returns an array of { day, minutes } (Mon → Sun).
 * We use the number of sessions per day as a proxy for minutes (1 session ≈ 10 min).
 */
export function computeWeeklyActivity(
  sessions: UserGameSessionDTO[]
): { day: string; minutes: number }[] {
  const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Get the Monday of the current week
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return DAYS.map((day, i) => {
    const target = new Date(monday);
    target.setDate(monday.getDate() + i);
    const label = target.toISOString().split('T')[0]; // "YYYY-MM-DD"

    const sessionsOnDay = sessions.filter((s) => s.sessionDate === label);
    // Each session ≈ 10 minutes of play — capped for charting purposes
    const minutes = Math.min(sessionsOnDay.length * 10, 90);
    return { day, minutes };
  });
}
