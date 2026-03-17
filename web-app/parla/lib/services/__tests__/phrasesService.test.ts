/**
 * Unit tests for PhrasesService
 * Tests all methods with mocked axios responses
 */

import PhrasesService, { phrasesService } from '../phrasesService';
import coreApiClient from '@/lib/api/coreApiClient';
import {
  Phrase,
  PhraseCreate,
  ReviewResponse,
  TranslateResponse,
  ReviewHistory,
  ReviewQuality,
} from '@/lib/types/phrases';
import { AxiosError } from 'axios';

// Mock the axios client
jest.mock('@/lib/api/coreApiClient');
const mockedAxios = coreApiClient as jest.Mocked<typeof coreApiClient>;

describe('PhrasesService', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPhrases', () => {
    it('should fetch all phrases successfully', async () => {
      const mockPhrases: Phrase[] = [
        {
          id: 1,
          active: true,
          source_language: { id: 1, name: 'English' },
          target_language: { id: 2, name: 'Spanish' },
          user_id: 1,
          original_text: 'hello',
          translated_text: 'hola',
          pronunciation: '/həˈloʊ/',
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
          original_text: 'goodbye',
          translated_text: 'adiós',
          pronunciation: null,
          last_reviewed_date: null,
          next_review_date: null,
          created_at: '2026-03-12T01:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockPhrases });

      const result = await phrasesService.getAllPhrases();

      expect(mockedAxios.get).toHaveBeenCalledWith('/phrases/');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPhrases);
      expect(result).toHaveLength(2);
    });

    it('should handle errors when fetching phrases fails', async () => {
      const mockError = new AxiosError(
        'Request failed',
        '500',
        undefined,
        {},
        {
          status: 500,
          statusText: 'Internal Server Error',
          data: { detail: 'Internal server error' },
          headers: {},
          config: {} as unknown as any,
        }
      );

      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(phrasesService.getAllPhrases()).rejects.toMatchObject({
        detail: 'Internal server error',
        status: 500,
      });
    });

    it('should return empty array when no phrases exist', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      const result = await phrasesService.getAllPhrases();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('createPhrase', () => {
    it('should create a new phrase successfully', async () => {
      const newPhraseData: PhraseCreate = {
        user_id: 1,
        source_language_id: 1,
        target_language_id: 2,
        original_text: 'thank you',
        translated_text: 'gracias',
        pronunciation: null,
      };

      const mockCreatedPhrase: Phrase = {
        id: 3,
        active: true,
        source_language: { id: 1, name: 'English' },
        target_language: { id: 2, name: 'Spanish' },
        user_id: 1,
        original_text: 'thank you',
        translated_text: 'gracias',
        pronunciation: null,
        last_reviewed_date: null,
        next_review_date: null,
        created_at: '2026-03-12T02:00:00Z',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockCreatedPhrase });

      const result = await phrasesService.createPhrase(newPhraseData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/phrases/', newPhraseData);
      expect(result).toEqual(mockCreatedPhrase);
      expect(result.id).toBe(3);
    });

    it('should handle validation errors when creating phrase', async () => {
      const invalidData: PhraseCreate = {
        user_id: 1,
        source_language_id: 1,
        target_language_id: 2,
        original_text: '',
        translated_text: '',
      };

      const mockError = new AxiosError(
        'Invalid input data',
        '400',
        undefined,
        {},
        {
          status: 400,
          statusText: 'Bad Request',
          data: { detail: 'Invalid input data' },
          headers: {},
          config: {} as unknown as any,
        }
      );

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(phrasesService.createPhrase(invalidData)).rejects.toMatchObject({
        detail: 'Invalid input data',
        status: 400,
      });
    });
  });

  describe('getDuePhrases', () => {
    it('should fetch due phrases for a user', async () => {
      const userId = 1;
      const mockDuePhrases: Phrase[] = [
        {
          id: 1,
          active: true,
          source_language: { id: 1, name: 'English' },
          target_language: { id: 2, name: 'Spanish' },
          user_id: 1,
          original_text: 'hello',
          translated_text: 'hola',
          pronunciation: null,
          last_reviewed_date: '2026-03-10T00:00:00Z',
          next_review_date: '2026-03-12T00:00:00Z',
          created_at: '2026-03-01T00:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockDuePhrases });

      const result = await phrasesService.getDuePhrases(userId);

      expect(mockedAxios.get).toHaveBeenCalledWith('/phrases/due', {
        params: { user_id: userId },
      });
      expect(result).toEqual(mockDuePhrases);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no phrases are due', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      const result = await phrasesService.getDuePhrases(1);

      expect(result).toEqual([]);
    });
  });

  describe('getPhraseById', () => {
    it('should fetch a phrase by ID successfully', async () => {
      const phraseId = 1;
      const mockPhrase: Phrase = {
        id: 1,
        active: true,
        source_language: { id: 1, name: 'English' },
        target_language: { id: 2, name: 'Spanish' },
        user_id: 1,
        original_text: 'hello',
        translated_text: 'hola',
        pronunciation: '/həˈloʊ/',
        last_reviewed_date: null,
        next_review_date: null,
        created_at: '2026-03-12T00:00:00Z',
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockPhrase });

      const result = await phrasesService.getPhraseById(phraseId);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/phrases/${phraseId}`);
      expect(result).toEqual(mockPhrase);
      expect(result.id).toBe(phraseId);
    });

    it('should handle 404 error when phrase not found', async () => {
      const mockError = new AxiosError(
        'Phrase not found',
        '404',
        undefined,
        {},
        {
          status: 404,
          statusText: 'Not Found',
          data: { detail: 'Phrase not found' },
          headers: {},
          config: {} as unknown as any,
        }
      );

      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(phrasesService.getPhraseById(999)).rejects.toMatchObject({
        detail: 'Phrase not found',
        status: 404,
      });
    });
  });

  describe('deletePhrase', () => {
    it('should delete a phrase successfully', async () => {
      const phraseId = 1;

      mockedAxios.delete.mockResolvedValueOnce({ data: null });

      await phrasesService.deletePhrase(phraseId);

      expect(mockedAxios.delete).toHaveBeenCalledWith(`/phrases/${phraseId}`);
      expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle 404 error when deleting non-existent phrase', async () => {
      const mockError = new AxiosError(
        'Phrase not found',
        '404',
        undefined,
        {},
        {
          status: 404,
          statusText: 'Not Found',
          data: { detail: 'Phrase not found' },
          headers: {},
          config: {} as unknown as any,
        }
      );

      mockedAxios.delete.mockRejectedValueOnce(mockError);

      await expect(phrasesService.deletePhrase(999)).rejects.toMatchObject({
        detail: 'Phrase not found',
        status: 404,
      });
    });
  });

  describe('reviewPhrase', () => {
    it('should submit a review with quality score successfully', async () => {
      const phraseId = 1;
      const quality = ReviewQuality.PERFECT;

      const mockReviewResponse: ReviewResponse = {
        phrase_id: 1,
        repetition_number: 1,
        easiness_factor: 2.6,
        inner_repetition_interval: 1,
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockReviewResponse });

      const result = await phrasesService.reviewPhrase(phraseId, quality);

      expect(mockedAxios.post).toHaveBeenCalledWith(`/phrases/${phraseId}/review`, {
        quality,
      });
      expect(result).toEqual(mockReviewResponse);
      expect(result.phrase_id).toBe(phraseId);
    });

    it('should handle different quality levels correctly', async () => {
      const testCases = [
        { quality: ReviewQuality.COMPLETE_BLACKOUT, expectedInterval: 1 },
        { quality: ReviewQuality.CORRECT_DIFFICULT, expectedInterval: 1 },
        { quality: ReviewQuality.PERFECT, expectedInterval: 1 },
      ];

      for (const testCase of testCases) {
        const mockResponse: ReviewResponse = {
          phrase_id: 1,
          repetition_number: 1,
          easiness_factor: 2.5,
          inner_repetition_interval: testCase.expectedInterval,
        };

        mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

        const result = await phrasesService.reviewPhrase(1, testCase.quality);

        expect(result.inner_repetition_interval).toBe(testCase.expectedInterval);
      }
    });

    it('should handle invalid quality score', async () => {
      const mockError = new AxiosError(
        'Quality must be between 0 and 5',
        '400',
        undefined,
        {},
        {
          status: 400,
          statusText: 'Bad Request',
          data: { detail: 'Quality must be between 0 and 5' },
          headers: {},
          config: {} as unknown as any,
        }
      );

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(phrasesService.reviewPhrase(1, 10)).rejects.toMatchObject({
        detail: 'Quality must be between 0 and 5',
        status: 400,
      });
    });
  });

  describe('translate', () => {
    it('should translate text successfully', async () => {
      const translateRequest = {
        text: 'hello',
        source_lang: 'en',
        target_lang: 'es',
      };

      const mockTranslateResponse: TranslateResponse = {
        original: 'hello',
        translated_text: 'hola',
        pronunciation: '/ˈola/',
        source_lang: 'en',
        target_lang: 'es',
        provider: 'deepl',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockTranslateResponse });

      const result = await phrasesService.translate(translateRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith('/translate/', translateRequest);
      expect(result).toEqual(mockTranslateResponse);
      expect(result.translated_text).toBe('hola');
      expect(result.provider).toBe('deepl');
    });

    it('should handle translation service unavailable', async () => {
      const mockError = new AxiosError(
        'Translation service unavailable',
        '503',
        undefined,
        {},
        {
          status: 503,
          statusText: 'Service Unavailable',
          data: { detail: 'Translation service unavailable' },
          headers: {},
          config: {} as unknown as any,
        }
      );

      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(
        phrasesService.translate({
          text: 'hello',
          source_lang: 'en',
          target_lang: 'es',
        })
      ).rejects.toMatchObject({
        detail: 'Translation service unavailable',
        status: 503,
      });
    });

    it('should handle different translation providers', async () => {
      const providers = ['deepl', 'libretranslate', 'mymemory'];

      for (const provider of providers) {
        const mockResponse: TranslateResponse = {
          original: 'test',
          translated_text: 'prueba',
          pronunciation: null,
          source_lang: 'en',
          target_lang: 'es',
          provider,
        };

        mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

        const result = await phrasesService.translate({
          text: 'test',
          source_lang: 'en',
          target_lang: 'es',
        });

        expect(result.provider).toBe(provider);
      }
    });
  });

  describe('logReview', () => {
    it('should log a review in history successfully', async () => {
      const reviewData = {
        user_id: 1,
        phrase_id: 1,
        quality: 5,
      };

      const mockReviewHistory: ReviewHistory = {
        id: '507f1f77bcf86cd799439011',
        user_id: 1,
        phrase_id: 1,
        quality: 5,
        reviewed_at: '2026-03-12T12:00:00Z',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockReviewHistory });

      const result = await phrasesService.logReview(reviewData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/review-history/', reviewData);
      expect(result).toEqual(mockReviewHistory);
      expect(result.id).toBeTruthy();
    });
  });

  describe('getReviewHistoryByUser', () => {
    it('should fetch review history for a user', async () => {
      const userId = 1;
      const mockHistory: ReviewHistory[] = [
        {
          id: '1',
          user_id: 1,
          phrase_id: 1,
          quality: 5,
          reviewed_at: '2026-03-12T12:00:00Z',
        },
        {
          id: '2',
          user_id: 1,
          phrase_id: 2,
          quality: 4,
          reviewed_at: '2026-03-12T13:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockHistory });

      const result = await phrasesService.getReviewHistoryByUser(userId);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/review-history/user/${userId}`);
      expect(result).toEqual(mockHistory);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no review history', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      const result = await phrasesService.getReviewHistoryByUser(999);

      expect(result).toEqual([]);
    });
  });

  describe('getReviewHistoryByPhrase', () => {
    it('should fetch review history for a phrase', async () => {
      const phraseId = 1;
      const mockHistory: ReviewHistory[] = [
        {
          id: '1',
          user_id: 1,
          phrase_id: 1,
          quality: 3,
          reviewed_at: '2026-03-10T12:00:00Z',
        },
        {
          id: '2',
          user_id: 1,
          phrase_id: 1,
          quality: 4,
          reviewed_at: '2026-03-11T12:00:00Z',
        },
        {
          id: '3',
          user_id: 1,
          phrase_id: 1,
          quality: 5,
          reviewed_at: '2026-03-12T12:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockHistory });

      const result = await phrasesService.getReviewHistoryByPhrase(phraseId);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/review-history/phrase/${phraseId}`);
      expect(result).toEqual(mockHistory);
      expect(result).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new AxiosError(
        'Network Error',
        'ECONNABORTED',
        undefined,
        {}
      );
      networkError.request = {};

      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(phrasesService.getAllPhrases()).rejects.toMatchObject({
        detail: 'Network Error',
      });
    });

    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Something went wrong');

      mockedAxios.get.mockRejectedValueOnce(unexpectedError);

      await expect(phrasesService.getAllPhrases()).rejects.toMatchObject({
        detail: 'An unexpected error occurred',
      });
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      } as AxiosError;

      mockedAxios.get.mockRejectedValueOnce(timeoutError);

      await expect(phrasesService.getAllPhrases()).rejects.toMatchObject({
        detail: 'An unexpected error occurred',
      });
    });
  });

  describe('Service Instance', () => {
    it('should export a singleton instance', () => {
      expect(phrasesService).toBeInstanceOf(PhrasesService);
    });

    it('should allow creating new instances', () => {
      const newInstance = new PhrasesService();
      expect(newInstance).toBeInstanceOf(PhrasesService);
      expect(newInstance).not.toBe(phrasesService);
    });
  });
});
