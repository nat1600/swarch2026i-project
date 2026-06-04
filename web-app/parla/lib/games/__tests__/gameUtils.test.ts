import { shuffle, buildFillRound, buildStopwatchChoices, buildMatchCards } from '../gameUtils';
import { Phrase } from '@/lib/types/phrases';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePhrase(overrides: Partial<Phrase> = {}): Phrase {
  return {
    id: 1,
    active: true,
    source_language: { id: 1, name: 'English' },
    target_language: { id: 2, name: 'Spanish' },
    user_id: 1,
    original_text: 'The quick brown fox',
    translated_text: 'El veloz zorro marrón',
    pronunciation: null,
    last_reviewed_date: null,
    next_review_date: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makePhrasePool(count: number): Phrase[] {
  return Array.from({ length: count }, (_, i) =>
    makePhrase({
      id: i + 1,
      original_text: `Word${i + 1} and more text`,
      translated_text: `Traduccion${i + 1}`,
    })
  );
}

// ─── shuffle ─────────────────────────────────────────────────────────────────

describe('shuffle', () => {
  it('returns an array with the same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(arr.length);
    expect(result.sort()).toEqual([...arr].sort());
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it('works on empty arrays', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('works on single-element arrays', () => {
    expect(shuffle(['only'])).toEqual(['only']);
  });

  it('shuffles strings', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const result = shuffle(arr);
    expect(result.sort()).toEqual([...arr].sort());
  });
});

// ─── buildFillRound ──────────────────────────────────────────────────────────

describe('buildFillRound', () => {
  it('returns null for single-word phrases', () => {
    const phrase = makePhrase({ original_text: 'Hello' });
    expect(buildFillRound(phrase)).toBeNull();
  });

  it('returns a round with one blank for multi-word phrases', () => {
    const pool = makePhrasePool(5);
    const phrase = makePhrase({ original_text: 'The quick brown fox' });
    const round = buildFillRound(phrase, pool);
    expect(round).not.toBeNull();
    expect(round!.display).toContain('___');
    expect(round!.display.split(' ').filter((w) => w === '___')).toHaveLength(1);
  });

  it('blanked word is part of the original text', () => {
    const pool = makePhrasePool(5);
    const words = ['The', 'quick', 'brown', 'fox'];
    const phrase = makePhrase({ original_text: words.join(' ') });
    const round = buildFillRound(phrase, pool);
    expect(round).not.toBeNull();
    expect(words).toContain(round!.answer);
  });

  it('choices array contains the correct answer', () => {
    const pool = makePhrasePool(5);
    const phrase = makePhrase({ original_text: 'Hello world today again' });
    const round = buildFillRound(phrase, pool);
    expect(round).not.toBeNull();
    expect(round!.choices).toContain(round!.answer);
  });

  it('choices array has exactly 4 options when pool is large enough', () => {
    const pool = makePhrasePool(8);
    const phrase = makePhrase({ id: 99, original_text: 'Hello world today again' });
    const round = buildFillRound(phrase, pool);
    expect(round).not.toBeNull();
    expect(round!.choices).toHaveLength(4);
  });

  it('display replaces exactly the blanked word with ___', () => {
    const pool = makePhrasePool(5);
    const phrase = makePhrase({ original_text: 'Hello world today' });
    const round = buildFillRound(phrase, pool);
    expect(round).not.toBeNull();
    const parts = round!.display.split(' ');
    const blankIdx = parts.indexOf('___');
    expect(blankIdx).toBeGreaterThanOrEqual(0);
    const original = phrase.original_text.split(' ');
    original[blankIdx] = '___';
    expect(parts).toEqual(original);
  });

  it('phrase reference is preserved in the round', () => {
    const pool = makePhrasePool(5);
    const phrase = makePhrase({ id: 42, original_text: 'Learn something new today' });
    const round = buildFillRound(phrase, pool);
    expect(round!.phrase.id).toBe(42);
  });

  it('handles phrases with leading/trailing spaces', () => {
    const pool = makePhrasePool(5);
    const phrase = makePhrase({ original_text: '  hello world today  ' });
    const round = buildFillRound(phrase, pool);
    expect(round).not.toBeNull();
  });
});

// ─── buildStopwatchChoices ───────────────────────────────────────────────────

describe('buildStopwatchChoices', () => {
  const pool = makePhrasePool(8);
  const correct = pool[0];

  it('returns exactly numChoices options', () => {
    const choices = buildStopwatchChoices(correct, pool, 4);
    expect(choices).toHaveLength(4);
  });

  it('always includes the correct translated_text', () => {
    for (let i = 0; i < 10; i++) {
      const choices = buildStopwatchChoices(correct, pool, 4);
      expect(choices).toContain(correct.translated_text);
    }
  });

  it('does not include duplicate values (all distractors come from other phrases)', () => {
    const choices = buildStopwatchChoices(correct, pool, 4);
    const unique = new Set(choices);
    expect(unique.size).toBe(choices.length);
  });

  it('distractors are from other phrases in the pool', () => {
    const choices = buildStopwatchChoices(correct, pool, 4);
    const distractors = choices.filter((c) => c !== correct.translated_text);
    const poolTranslations = pool.filter((p) => p.id !== correct.id).map((p) => p.translated_text);
    distractors.forEach((d) => expect(poolTranslations).toContain(d));
  });

  it('returns all available options when pool is smaller than numChoices', () => {
    const smallPool = makePhrasePool(2);
    const choices = buildStopwatchChoices(smallPool[0], smallPool, 4);
    // Only 1 correct + 1 distractor available = 2 total
    expect(choices).toHaveLength(2);
    expect(choices).toContain(smallPool[0].translated_text);
  });
});

// ─── buildMatchCards ─────────────────────────────────────────────────────────

describe('buildMatchCards', () => {
  const pairs = makePhrasePool(6);

  it('produces the same number of cards in each column as input pairs', () => {
    const { originals, translations } = buildMatchCards(pairs);
    expect(originals).toHaveLength(pairs.length);
    expect(translations).toHaveLength(pairs.length);
  });

  it('every original card has side = "original"', () => {
    const { originals } = buildMatchCards(pairs);
    originals.forEach((c) => expect(c.side).toBe('original'));
  });

  it('every translation card has side = "translation"', () => {
    const { translations } = buildMatchCards(pairs);
    translations.forEach((c) => expect(c.side).toBe('translation'));
  });

  it('all cards start as not matched', () => {
    const { originals, translations } = buildMatchCards(pairs);
    [...originals, ...translations].forEach((c) => expect(c.matched).toBe(false));
  });

  it('original card ids are prefixed with "o-"', () => {
    const { originals } = buildMatchCards(pairs);
    originals.forEach((c) => expect(c.id).toMatch(/^o-/));
  });

  it('translation card ids are prefixed with "t-"', () => {
    const { translations } = buildMatchCards(pairs);
    translations.forEach((c) => expect(c.id).toMatch(/^t-/));
  });

  it('each original card has a matching translation card with the same phraseId', () => {
    const { originals, translations } = buildMatchCards(pairs);
    const translationPhraseIds = new Set(translations.map((c) => c.phraseId));
    originals.forEach((c) => expect(translationPhraseIds.has(c.phraseId)).toBe(true));
  });

  it('original text matches the phrase original_text', () => {
    const { originals } = buildMatchCards(pairs);
    originals.forEach((card) => {
      const phrase = pairs.find((p) => p.id === card.phraseId)!;
      expect(card.text).toBe(phrase.original_text);
    });
  });

  it('translation text matches the phrase translated_text', () => {
    const { translations } = buildMatchCards(pairs);
    translations.forEach((card) => {
      const phrase = pairs.find((p) => p.id === card.phraseId)!;
      expect(card.text).toBe(phrase.translated_text);
    });
  });
});
