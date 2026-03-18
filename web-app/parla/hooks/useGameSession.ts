'use client';

import { useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { saveGameSession, registerUserActivity } from '@/lib/api/gamificationService';

interface GameSessionPayload {
  gamePlayed: string;
  points: number;
}

/**
 * Hook that records a completed game session and registers daily streak activity.
 *
 * Usage:
 *   const { recordGameSession } = useGameSession();
 *   // call when game is over:
 *   await recordGameSession({ gamePlayed: 'word-match', points: 150 });
 */
export function useGameSession() {
  const { user } = useUser();

  const recordGameSession = useCallback(
    async ({ gamePlayed, points }: GameSessionPayload) => {
      // Use Auth0 sub as the unique userName key (e.g. "auth0|abc123")
      const userName = user?.sub;
      if (!userName) {
        console.warn('useGameSession: no authenticated user, skipping record.');
        return;
      }

      // Fire both requests concurrently; errors are swallowed inside each helper
      await Promise.all([
        saveGameSession({ userName, gamePlayed, points }),
        registerUserActivity(userName),
      ]);
    },
    [user]
  );

  return { recordGameSession };
}
