/**
 * Integration tests for Dictionary Population
 * Tests the complete flow with real sample data
 */

import { populateDictionaryFromPhrasesArray } from '../dictionaryPopulation';
import { Phrase } from '@/lib/types/phrases';

// Mock fetch for Dictionary API
global.fetch = jest.fn();

const SAMPLE_PHRASES: Phrase[] = [
  {
    id: 1,
    active: true,
    source_language: { id: 1, name: 'English' },
    target_language: { id: 2, name: 'Spanish' },
    user_id: 1,
    original_text: 'The quick brown fox jumps over the lazy dog',
    translated_text: 'El rápido zorro marrón salta sobre el perro perezoso',
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
    original_text: 'Learning new languages opens doors',
    translated_text: 'Aprender nuevos idiomas abre puertas',
    pronunciation: null,
    last_reviewed_date: null,
    next_review_date: null,
    created_at: '2026-03-12T01:00:00Z',
  },
  {
    id: 3,
    active: true,
    source_language: { id: 1, name: 'English' },
    target_language: { id: 2, name: 'Spanish' },
    user_id: 1,
    original_text: 'Practice makes perfect',
    translated_text: 'La práctica hace al maestro',
    pronunciation: null,
    last_reviewed_date: null,
    next_review_date: null,
    created_at: '2026-03-12T02:00:00Z',
  },
];

describe('Dictionary Population Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract unique words from sample phrases', async () => {
    // Mock API responses for each word
    const mockApiResponse = (word: string) => ({
      word,
      phonetic: '/test/',
      phonetics: [{ text: '/test/', audio: 'http://example.com/audio.mp3' }],
      meanings: [
        {
          partOfSpeech: 'noun',
          definitions: [
            {
              definition: `Definition of ${word}`,
              example: `Example with ${word}`,
              synonyms: ['synonym1'],
              antonyms: ['antonym1'],
            },
          ],
          synonyms: ['synonym1'],
          antonyms: ['antonym1'],
        },
      ],
    });

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      const word = url.split('/').pop();
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockApiResponse(word || 'test')]),
      });
    });

    const result = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
      filterStopWords: true,
      maxDefinitionsPerWord: 3,
      targetLanguage: 'es',
    });

    // Verify basic results
    expect(result.success).toBe(true);
    expect(result.totalPhrases).toBe(3);
    expect(result.totalWords).toBeGreaterThan(0);
    expect(result.successfulDefinitions).toBeGreaterThan(0);
    expect(result.dictionaryEntries.length).toBeGreaterThan(0);

    console.log('\n=== Integration Test Results ===');
    console.log(`Total Phrases: ${result.totalPhrases}`);
    console.log(`Total Words Extracted: ${result.totalWords}`);
    console.log(`Successful Definitions: ${result.successfulDefinitions}`);
    console.log(`Failed Definitions: ${result.failedDefinitions}`);
    console.log(`Dictionary Entries: ${result.dictionaryEntries.length}`);
  });

  it('should track progress through all stages', async () => {
    const progressStages: string[] = [];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{
        word: 'test',
        meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'test def' }] }],
        phonetics: [],
      }]),
    });

    await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
      filterStopWords: true,
      onProgress: (progress) => {
        progressStages.push(progress.stage);
      },
    });

    expect(progressStages).toContain('fetching_definitions');
    expect(progressStages).toContain('creating_entries');
  });

  it('should filter stop words correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{
        word: 'test',
        meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'test' }] }],
        phonetics: [],
      }]),
    });

    const resultWithFilter = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
      filterStopWords: true,
    });

    const resultWithoutFilter = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
      filterStopWords: false,
    });

    // Without filter should have more words (includes "the", "a", etc.)
    expect(resultWithoutFilter.totalWords).toBeGreaterThan(resultWithFilter.totalWords);

    console.log('\n=== Stop Words Filtering ===');
    console.log(`With filter: ${resultWithFilter.totalWords} words`);
    console.log(`Without filter: ${resultWithoutFilter.totalWords} words`);
    console.log(`Difference: ${resultWithoutFilter.totalWords - resultWithFilter.totalWords} stop words`);
  });

  it('should create valid dictionary entries with all required fields', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{
        word: 'quick',
        phonetic: '/kwɪk/',
        phonetics: [{ text: '/kwɪk/', audio: 'http://example.com/quick.mp3' }],
        meanings: [
          {
            partOfSpeech: 'adjective',
            definitions: [
              {
                definition: 'Moving fast',
                example: 'A quick response',
                synonyms: ['fast', 'rapid'],
                antonyms: ['slow'],
              },
              {
                definition: 'Done with speed',
                example: 'Quick work',
              },
              {
                definition: 'Prompt to understand',
                example: 'Quick learner',
              },
            ],
            synonyms: ['swift'],
            antonyms: ['sluggish'],
          },
        ],
      }]),
    });

    const result = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES.slice(0, 1), {
      filterStopWords: true,
      maxDefinitionsPerWord: 3,
    });

    expect(result.dictionaryEntries.length).toBeGreaterThan(0);

    const entry = result.dictionaryEntries[0];
    
    // Verify all required fields exist
    expect(entry.id).toBeDefined();
    expect(entry.word).toBeDefined();
    expect(entry.language).toBeDefined();
    expect(entry.targetLanguage).toBeDefined();
    expect(entry.difficulty).toBeDefined();
    expect(entry.wordType).toBeDefined();
    expect(entry.definitions).toBeDefined();
    expect(Array.isArray(entry.definitions)).toBe(true);
    expect(entry.synonyms).toBeDefined();
    expect(entry.antonyms).toBeDefined();
    expect(entry.examples).toBeDefined();
    expect(entry.isFavorite).toBe(false);
    expect(entry.isLearned).toBe(false);
    expect(entry.reviewCount).toBe(0);
    expect(entry.createdAt).toBeInstanceOf(Date);

    console.log('\n=== Sample Dictionary Entry ===');
    console.log(`Word: ${entry.word}`);
    console.log(`Type: ${entry.wordType}`);
    console.log(`Difficulty: ${entry.difficulty}`);
    console.log(`Definitions: ${entry.definitions.length}`);
    console.log(`Synonyms: ${entry.synonyms.join(', ')}`);
  });

  it('should limit definitions to maxDefinitionsPerWord', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{
        word: 'test',
        phonetics: [],
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: [
              { definition: 'Def 1' },
              { definition: 'Def 2' },
              { definition: 'Def 3' },
              { definition: 'Def 4' },
              { definition: 'Def 5' },
            ],
          },
        ],
      }]),
    });

    const result = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES.slice(0, 1), {
      maxDefinitionsPerWord: 3,
    });

    const entry = result.dictionaryEntries.find(e => e.word === 'test');
    if (entry) {
      expect(entry.definitions.length).toBeLessThanOrEqual(3);
    }
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES.slice(0, 1), {
      filterStopWords: true,
    });

    // Should complete but with failed definitions
    expect(result.success).toBe(false);
    expect(result.failedDefinitions).toBeGreaterThan(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should extract words from correct language', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{
        word: 'test',
        meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'test' }] }],
        phonetics: [],
      }]),
    });

    const result = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
      filterStopWords: true,
    });

    // All entries should be from English (source language)
    result.dictionaryEntries.forEach(entry => {
      expect(entry.language.toLowerCase()).toContain('english');
    });
  });
});
