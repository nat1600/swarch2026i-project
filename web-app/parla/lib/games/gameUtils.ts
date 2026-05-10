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
  choices: string[];
  phrase: Phrase;
}

// Words too trivial to blank (articles, prepositions, conjunctions, short fillers)
const SKIP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','up','out','as','if','it','is','was','be','do','so','no','not','me',
  'my','we','he','she','they','you','i','us','him','her','its','our','your',
  // Spanish
  'el','la','los','las','un','una','unos','unas','de','en','con','por','para',
  'que','se','le','lo','al','del','yo','tú','él','ella','nosotros','ellos',
  'es','son','fue','era','hay','mi','tu','su','nos','les','como','más','si',
]);

/**
 * Builds a round by blanking a meaningful content word and generating 4 word choices.
 * Distractors are pulled from other phrases in allPhrases.
 * Returns null if no suitable word found.
 */
export function buildFillRound(phrase: Phrase, allPhrases: Phrase[] = []): FillRound | null {
  const words = phrase.original_text.trim().split(/\s+/);
  if (words.length < 2) return null;

  // Prefer words ≥4 chars that aren't stop words; strip trailing punctuation for comparison
  const candidates = words
    .map((w, i) => ({ w, i, clean: w.replace(/[^a-záéíóúüñA-Z]/gi, '').toLowerCase() }))
    .filter(({ clean }) => clean.length >= 4 && !SKIP_WORDS.has(clean));

  // Fall back to any word ≥3 chars if nothing better found
  const candidatePool = candidates.length > 0
    ? candidates
    : words
        .map((w, i) => ({ w, i, clean: w.replace(/[^a-záéíóúüñA-Z]/gi, '').toLowerCase() }))
        .filter(({ clean }) => clean.length >= 3 && !SKIP_WORDS.has(clean));

  if (candidatePool.length === 0) return null;

  const { w: answer, i: blankIdx } = candidatePool[Math.floor(Math.random() * candidatePool.length)];
  const display = words.map((w, i) => (i === blankIdx ? '___' : w)).join(' ');

  // Build distractors: meaningful words from other phrases, same character range
  const answerClean = answer.replace(/[^a-záéíóúüñA-Z]/gi, '').toLowerCase();
  const distractorSet = new Set<string>([answerClean]);
  const distractors: string[] = [];

  for (const other of shuffle(allPhrases.filter((p) => p.id !== phrase.id && p.original_text?.trim()))) {
    if (distractors.length >= 3) break;
    const otherWords = other.original_text.trim().split(/\s+/);
    const good = shuffle(
      otherWords.filter((w) => {
        const cl = w.replace(/[^a-záéíóúüñA-Z]/gi, '').toLowerCase();
        return cl.length >= 3 && !SKIP_WORDS.has(cl) && !distractorSet.has(cl);
      })
    );
    if (good.length > 0) {
      distractors.push(good[0]);
      distractorSet.add(good[0].replace(/[^a-záéíóúüñA-Z]/gi, '').toLowerCase());
    }
  }

  // Pad with random letter combos if we still need distractors
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  while (distractors.length < 3) {
    const fake = Array.from({ length: answer.length }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join('');
    if (!distractorSet.has(fake)) {
      distractors.push(fake);
      distractorSet.add(fake);
    }
  }

  const choices = shuffle([answer, ...distractors]);
  return { display, answer, choices, phrase };
}

// ─── Stopwatch ───────────────────────────────────────────────────────────────

/**
 * Generates (count) distractors by scrambling the words of the correct translation.
 * Each distractor has a different word order, guaranteed to differ from the original
 * and from each other.
 */
export function scrambleDistractors(text: string, count = 3): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) {
    // Single word: can't scramble — pad with partial text variants
    return Array.from({ length: count }, (_, i) =>
      words[0].split('').reverse().join('') + (i > 0 ? i : '')
    );
  }

  const distractors: string[] = [];
  const seen = new Set<string>([text]);
  let attempts = 0;

  while (distractors.length < count && attempts < 200) {
    attempts++;
    const candidate = shuffle([...words]).join(' ');
    if (!seen.has(candidate)) {
      seen.add(candidate);
      distractors.push(candidate);
    }
  }

  // If not enough unique scrambles (very short phrases), repeat with slight mutation
  while (distractors.length < count) {
    const base = shuffle([...words]);
    const candidate = [...base.slice(1), base[0]].join(' ');
    if (!seen.has(candidate)) {
      seen.add(candidate);
      distractors.push(candidate);
    } else {
      distractors.push(base.reverse().join(' ') + ' ?');
    }
  }

  return distractors;
}

/**
 * Builds a multiple-choice set for the stopwatch game.
 * Returns the correct translated_text plus (numChoices - 1) scrambled versions
 * of the same translation. Result is shuffled.
 */
export function buildStopwatchChoices(
  correct: Phrase,
  _pool: Phrase[],
  numChoices = 4
): string[] {
  const distractors = scrambleDistractors(correct.translated_text, numChoices - 1);
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
