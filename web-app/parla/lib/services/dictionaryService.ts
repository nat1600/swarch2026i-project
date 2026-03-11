// Dictionary Service
// Helper functions for searching, filtering, and sorting dictionary words

import {
  DictionaryWord,
  DictionaryFilters,
  DictionarySort,
  DictionaryStats,
  GrammaticalCategory,
  Difficulty,
  Language,
} from '@/lib/types/dictionary';

/**
 * Search words by query (word, translation, definition, synonyms)
 */
export const searchWords = (words: DictionaryWord[], query: string): DictionaryWord[] => {
  if (!query.trim()) return words;

  const lowerQuery = query.toLowerCase();

  return words.filter(word => {
    // Search in word and translation
    if (word.word.toLowerCase().includes(lowerQuery)) return true;
    if (word.translation.toLowerCase().includes(lowerQuery)) return true;

    // Search in definitions
    if (word.definitions.some(def => def.meaning.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    // Search in examples
    if (word.examples.some(ex => 
      ex.sentence.toLowerCase().includes(lowerQuery) || 
      ex.translation.toLowerCase().includes(lowerQuery)
    )) {
      return true;
    }

    // Search in synonyms and antonyms
    if (word.synonyms.some(syn => syn.toLowerCase().includes(lowerQuery))) return true;
    if (word.antonyms.some(ant => ant.toLowerCase().includes(lowerQuery))) return true;

    // Search in tags
    if (word.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;

    return false;
  });
};

/**
 * Filter words by criteria
 */
export const filterWords = (words: DictionaryWord[], filters: DictionaryFilters): DictionaryWord[] => {
  return words.filter(word => {
    // Language filter
    if (filters.language !== 'all' && word.language !== filters.language) {
      return false;
    }

    // Word type filter
    if (filters.wordType !== 'all' && word.wordType !== filters.wordType) {
      return false;
    }

    // Difficulty filter
    if (filters.difficulty !== 'all' && word.difficulty !== filters.difficulty) {
      return false;
    }

    // Status filter
    if (filters.status === 'learned' && !word.isLearned) return false;
    if (filters.status === 'learning' && word.isLearned) return false;
    if (filters.status === 'favorites' && !word.isFavorite) return false;

    return true;
  });
};

/**
 * Sort words by criteria
 */
export const sortWords = (words: DictionaryWord[], sort: DictionarySort): DictionaryWord[] => {
  const sorted = [...words];

  switch (sort) {
    case 'alphabetical':
      return sorted.sort((a, b) => a.word.localeCompare(b.word));

    case 'date':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Newest first
      });

    case 'difficulty':
      const difficultyOrder: Record<Difficulty, number> = {
        easy: 1,
        medium: 2,
        hard: 3,
      };
      return sorted.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);

    case 'reviewCount':
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount);

    case 'favorites':
      return sorted.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return 0;
      });

    default:
      return sorted;
  }
};

/**
 * Get statistics from word list
 */
export const getWordStats = (words: DictionaryWord[]): DictionaryStats => {
  const stats: DictionaryStats = {
    total: words.length,
    learned: 0,
    favorites: 0,
    byLanguage: {} as Record<Language, number>,
    byDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
    byWordType: {
      noun: 0,
      verb: 0,
      adjective: 0,
      adverb: 0,
      pronoun: 0,
      preposition: 0,
      conjunction: 0,
      interjection: 0,
      other: 0,
    },
  };

  words.forEach(word => {
    // Count learned and favorites
    if (word.isLearned) stats.learned++;
    if (word.isFavorite) stats.favorites++;

    // Count by language
    stats.byLanguage[word.language] = (stats.byLanguage[word.language] || 0) + 1;

    // Count by difficulty
    stats.byDifficulty[word.difficulty]++;

    // Count by word type
    stats.byWordType[word.wordType]++;
  });

  return stats;
};

/**
 * Export words to JSON
 */
export const exportWordsToJSON = (words: DictionaryWord[]): string => {
  return JSON.stringify(words, null, 2);
};

/**
 * Import words from JSON
 */
export const importWordsFromJSON = (json: string): DictionaryWord[] => {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid format: expected array');
    }
    return parsed;
  } catch (error) {
    console.error('Import error:', error);
    return [];
  }
};

/**
 * Get words that need review (based on spaced repetition)
 */
export const getWordsForReview = (words: DictionaryWord[], limit: number = 10): DictionaryWord[] => {
  // Simple algorithm: prioritize unlearned words and least reviewed
  return words
    .filter(w => !w.isLearned)
    .sort((a, b) => a.reviewCount - b.reviewCount)
    .slice(0, limit);
};

/**
 * Get random words for practice
 */
export const getRandomWords = (words: DictionaryWord[], count: number): DictionaryWord[] => {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Group words by category
 */
export const groupWordsByCategory = (words: DictionaryWord[]): Record<GrammaticalCategory, DictionaryWord[]> => {
  const grouped: Record<GrammaticalCategory, DictionaryWord[]> = {
    noun: [],
    verb: [],
    adjective: [],
    adverb: [],
    pronoun: [],
    preposition: [],
    conjunction: [],
    interjection: [],
    other: [],
  };

  words.forEach(word => {
    grouped[word.wordType].push(word);
  });

  return grouped;
};
