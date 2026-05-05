import { Phrase } from '@/lib/types/phrases';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Fill-in-the-word ────────────────────────────────────────────────────────

export interface FillRound {
  display: string;
  answer: string;
  phrase: Phrase;
  hintLetter: string;
}

/**
 * Builds a round by blanking out one random word from the phrase's original_text.
 * Returns null if the phrase has fewer than 2 words (not playable).
 */
export function buildFillRound(phrase: Phrase): FillRound | null {
  const words = phrase.original_text.trim().split(/\s+/);
  if (words.length < 2) return null;
  const blankIdx = Math.floor(Math.random() * words.length);
  const answer = words[blankIdx];
  const display = words.map((w, i) => (i === blankIdx ? '___' : w)).join(' ');
  return { display, answer, phrase, hintLetter: answer[0] };
}

// ─── Stopwatch ───────────────────────────────────────────────────────────────

/**
 * Builds a multiple-choice set for the stopwatch game.
 * Returns one correct translated_text plus (numChoices - 1) distractors
 * drawn from other phrases in the pool. Result is shuffled.
 */
export function buildStopwatchChoices(
  correct: Phrase,
  pool: Phrase[],
  numChoices = 4
): string[] {
  const distractors = shuffle(pool.filter((p) => p.id !== correct.id))
    .slice(0, numChoices - 1)
    .map((p) => p.translated_text);
  return shuffle([correct.translated_text, ...distractors]);
}

// ─── Matching ────────────────────────────────────────────────────────────────

export interface MatchCard {
  id: string;
  phraseId: number;
  text: string;
  side: 'original' | 'translation';
  matched: boolean;
}

/**
 * Builds two separately-shuffled columns of cards (originals + translations)
 * from the given phrase pairs.
 */
export function buildMatchCards(pairs: Phrase[]): {
  originals: MatchCard[];
  translations: MatchCard[];
} {
  const originals: MatchCard[] = shuffle(
    pairs.map((p) => ({
      id: `o-${p.id}`,
      phraseId: p.id,
      text: p.original_text,
      side: 'original' as const,
      matched: false,
    }))
  );
  const translations: MatchCard[] = shuffle(
    pairs.map((p) => ({
      id: `t-${p.id}`,
      phraseId: p.id,
      text: p.translated_text,
      side: 'translation' as const,
      matched: false,
    }))
  );
  return { originals, translations };
}
