/**
 * Unit tests for Word Extraction Service
 */

import {
  normalizeWord,
  shouldFilterWord,
  extractWordsFromText,
  extractUniqueWordsFromPhrases,
  getWordStatistics,
  sortExtractedWords,
} from '../wordExtraction';
import { Phrase } from '@/lib/types/phrases';

describe('Word Extraction Service', () => {
  describe('normalizeWord', () => {
    it('should convert to lowercase', () => {
      expect(normalizeWord('HELLO')).toBe('hello');
      expect(normalizeWord('World')).toBe('world');
    });

    it('should remove punctuation', () => {
      expect(normalizeWord('hello!')).toBe('hello');
      expect(normalizeWord('world?')).toBe('world');
      expect(normalizeWord('test,')).toBe('test');
      expect(normalizeWord('¿Hola?')).toBe('hola');
    });

    it('should trim whitespace', () => {
      expect(normalizeWord('  hello  ')).toBe('hello');
      expect(normalizeWord('\tworld\n')).toBe('world');
    });

    it('should handle complex punctuation', () => {
      expect(normalizeWord('"hello"')).toBe('hello');
      expect(normalizeWord("'world'")).toBe('world');
      expect(normalizeWord('test...')).toBe('test');
    });
  });

  describe('shouldFilterWord', () => {
    it('should filter words shorter than minimum length', () => {
      expect(shouldFilterWord('a', 'en', false, 2)).toBe(true);
      expect(shouldFilterWord('I', 'en', false, 2)).toBe(true);
      expect(shouldFilterWord('ab', 'en', false, 2)).toBe(false);
    });

    it('should filter English stop words when enabled', () => {
      expect(shouldFilterWord('the', 'en', true)).toBe(true);
      expect(shouldFilterWord('and', 'en', true)).toBe(true);
      expect(shouldFilterWord('is', 'en', true)).toBe(true);
      expect(shouldFilterWord('hello', 'en', true)).toBe(false);
    });

    it('should filter Spanish stop words when enabled', () => {
      expect(shouldFilterWord('el', 'es', true)).toBe(true);
      expect(shouldFilterWord('la', 'es', true)).toBe(true);
      expect(shouldFilterWord('y', 'es', true)).toBe(true);
      expect(shouldFilterWord('hola', 'es', true)).toBe(false);
    });

    it('should not filter stop words when disabled', () => {
      expect(shouldFilterWord('the', 'en', false)).toBe(false);
      expect(shouldFilterWord('el', 'es', false)).toBe(false);
    });
  });

  describe('extractWordsFromText', () => {
    it('should extract words from simple text', () => {
      const words = extractWordsFromText('hello world', 1, 'english', false);
      
      expect(words).toHaveLength(2);
      expect(words[0].normalizedWord).toBe('hello');
      expect(words[1].normalizedWord).toBe('world');
    });

    it('should preserve original word and source phrase', () => {
      const text = 'Hello World!';
      const words = extractWordsFromText(text, 1, 'english', false);
      
      expect(words[0].word).toBe('Hello');
      expect(words[0].sourcePhrase).toBe(text);
      expect(words[0].sourcePhraseId).toBe(1);
    });

    it('should filter stop words when enabled', () => {
      const words = extractWordsFromText('the quick brown fox', 1, 'en', true);
      
      const normalizedWords = words.map(w => w.normalizedWord);
      expect(normalizedWords).not.toContain('the');
      expect(normalizedWords).toContain('quick');
      expect(normalizedWords).toContain('brown');
      expect(normalizedWords).toContain('fox');
    });

    it('should handle punctuation correctly', () => {
      const words = extractWordsFromText('Hello, world!', 1, 'english', false);
      
      expect(words[0].normalizedWord).toBe('hello');
      expect(words[1].normalizedWord).toBe('world');
    });

    it('should filter short words', () => {
      const words = extractWordsFromText('I am a student', 1, 'en', false);
      
      const normalizedWords = words.map(w => w.normalizedWord);
      expect(normalizedWords).not.toContain('i');
      expect(normalizedWords).not.toContain('a');
      expect(normalizedWords).toContain('am');
      expect(normalizedWords).toContain('student');
    });
  });

  describe('extractUniqueWordsFromPhrases', () => {
    const samplePhrases: Phrase[] = [
      {
        id: 1,
        active: true,
        source_language: { id: 1, name: 'English' },
        target_language: { id: 2, name: 'Spanish' },
        user_id: 1,
        original_text: 'hello world',
        translated_text: 'hola mundo',
        pronunciation: null,
        last_reviewed_date: null,
        next_review_date: null,
        created_at: '2026-03-12T00:00:00Z',
      },
      {
        id: 2,
        active: true,
        source_language: { id: 1, name: 'English' },
        target_language: { id: 2, name: 'Spanish' },
        user_id: 1,
        original_text: 'hello friend',
        translated_text: 'hola amigo',
        pronunciation: null,
        last_reviewed_date: null,
        next_review_date: null,
        created_at: '2026-03-12T01:00:00Z',
      },
    ];

    it('should extract unique words from multiple phrases', () => {
      const uniqueWords = extractUniqueWordsFromPhrases(samplePhrases, {
        filterStopWords: false,
        useOriginalText: true,
        useTranslatedText: false,
      });

      expect(uniqueWords.size).toBe(3); // hello, world, friend
      expect(uniqueWords.has('hello')).toBe(true);
      expect(uniqueWords.has('world')).toBe(true);
      expect(uniqueWords.has('friend')).toBe(true);
    });

    it('should not duplicate words', () => {
      const uniqueWords = extractUniqueWordsFromPhrases(samplePhrases, {
        filterStopWords: false,
        useOriginalText: true,
        useTranslatedText: false,
      });

      // "hello" appears twice but should only be counted once
      expect(uniqueWords.size).toBe(3);
    });

    it('should extract from translated text when enabled', () => {
      const uniqueWords = extractUniqueWordsFromPhrases(samplePhrases, {
        filterStopWords: false,
        useOriginalText: false,
        useTranslatedText: true,
      });

      expect(uniqueWords.has('hola')).toBe(true);
      expect(uniqueWords.has('mundo')).toBe(true);
      expect(uniqueWords.has('amigo')).toBe(true);
    });

    it('should filter stop words when enabled', () => {
      const phrasesWithStopWords: Phrase[] = [
        {
          ...samplePhrases[0],
          original_text: 'the quick brown fox',
        },
      ];

      const uniqueWords = extractUniqueWordsFromPhrases(phrasesWithStopWords, {
        filterStopWords: true,
        useOriginalText: true,
        useTranslatedText: false,
      });

      expect(uniqueWords.has('the')).toBe(false);
      expect(uniqueWords.has('quick')).toBe(true);
      expect(uniqueWords.has('brown')).toBe(true);
      expect(uniqueWords.has('fox')).toBe(true);
    });
  });

  describe('getWordStatistics', () => {
    it('should calculate correct statistics', () => {
      const words = new Map([
        ['hello', { word: 'Hello', normalizedWord: 'hello', sourcePhrase: 'test', sourcePhraseId: 1, language: 'english' }],
        ['world', { word: 'World', normalizedWord: 'world', sourcePhrase: 'test', sourcePhraseId: 1, language: 'english' }],
        ['hola', { word: 'Hola', normalizedWord: 'hola', sourcePhrase: 'test', sourcePhraseId: 2, language: 'spanish' }],
      ]);

      const stats = getWordStatistics(words);

      expect(stats.totalWords).toBe(3);
      expect(stats.byLanguage.get('english')).toBe(2);
      expect(stats.byLanguage.get('spanish')).toBe(1);
      expect(stats.averageWordLength).toBeCloseTo(4.67, 1);
    });

    it('should handle empty word map', () => {
      const words = new Map();
      const stats = getWordStatistics(words);

      expect(stats.totalWords).toBe(0);
      expect(stats.averageWordLength).toBe(0);
    });
  });

  describe('sortExtractedWords', () => {
    const words = [
      { word: 'Zebra', normalizedWord: 'zebra', sourcePhrase: 'test', sourcePhraseId: 3, language: 'en' },
      { word: 'Apple', normalizedWord: 'apple', sourcePhrase: 'test', sourcePhraseId: 1, language: 'en' },
      { word: 'Banana', normalizedWord: 'banana', sourcePhrase: 'test', sourcePhraseId: 2, language: 'en' },
    ];

    it('should sort alphabetically', () => {
      const sorted = sortExtractedWords(words, 'alphabetical');
      
      expect(sorted[0].normalizedWord).toBe('apple');
      expect(sorted[1].normalizedWord).toBe('banana');
      expect(sorted[2].normalizedWord).toBe('zebra');
    });

    it('should sort by length', () => {
      const wordsWithLength = [
        { word: 'Hi', normalizedWord: 'hi', sourcePhrase: 'test', sourcePhraseId: 1, language: 'en' },
        { word: 'Hello', normalizedWord: 'hello', sourcePhrase: 'test', sourcePhraseId: 1, language: 'en' },
        { word: 'Hey', normalizedWord: 'hey', sourcePhrase: 'test', sourcePhraseId: 1, language: 'en' },
      ];

      const sorted = sortExtractedWords(wordsWithLength, 'length');
      
      expect(sorted[0].normalizedWord).toBe('hello'); // longest first
      expect(sorted[1].normalizedWord).toBe('hey');
      expect(sorted[2].normalizedWord).toBe('hi');
    });

    it('should sort by phrase ID', () => {
      const sorted = sortExtractedWords(words, 'phrase');
      
      expect(sorted[0].sourcePhraseId).toBe(1);
      expect(sorted[1].sourcePhraseId).toBe(2);
      expect(sorted[2].sourcePhraseId).toBe(3);
    });
  });
});
