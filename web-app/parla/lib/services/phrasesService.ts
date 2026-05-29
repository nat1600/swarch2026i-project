// Phrases Service - Core Service API Integration
import coreApiClient from '@/lib/api/coreApiClient';
import {
  Phrase,
  PhraseCreate,
  PhraseUpdate,
  ReviewRequest,
  ReviewResponse,
  TranslateRequest,
  TranslateResponse,
  ReviewHistoryCreate,
  ReviewHistory,
  ApiError,
} from '@/lib/types/phrases';
import { AxiosError } from 'axios';

/**
 * Service class for interacting with Core Service Phrases API
 */
class PhrasesService {
  /**
   * Get all phrases
   * GET /phrases/
   */
  async getAllPhrases(): Promise<Phrase[]> {
    try {
      const response = await coreApiClient.get<Phrase[]>('/phrases/');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new phrase
   * POST /phrases/
   */
  async createPhrase(data: PhraseCreate): Promise<Phrase> {
    try {
      const response = await coreApiClient.post<Phrase>('/phrases/', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get phrases due for review today
   * GET /phrases/due?user_id={userId}
   */
  async getDuePhrases(userId: number): Promise<Phrase[]> {
    try {
      const response = await coreApiClient.get<Phrase[]>('/phrases/due', {
        params: { user_id: userId },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific phrase by ID
   * GET /phrases/{phraseId}
   */
  async getPhraseById(phraseId: number): Promise<Phrase> {
    try {
      const response = await coreApiClient.get<Phrase>(`/phrases/${phraseId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a phrase
   * PUT /phrases/{phraseId}
   */
  async updatePhrase(phraseId: number, data: PhraseUpdate): Promise<Phrase> {
    try {
      const response = await coreApiClient.put<Phrase>(`/phrases/${phraseId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a phrase (soft delete)
   * DELETE /phrases/{phraseId}
   */
  async deletePhrase(phraseId: number): Promise<void> {
    try {
      await coreApiClient.delete(`/phrases/${phraseId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit a review for a phrase (SM-2 algorithm)
   * POST /phrases/{phraseId}/review
   * @param phraseId - ID of the phrase to review
   * @param quality - Quality score (0-5)
   */
  async reviewPhrase(phraseId: number, quality: number): Promise<ReviewResponse> {
    try {
      const data: ReviewRequest = { quality };
      const response = await coreApiClient.post<ReviewResponse>(
        `/phrases/${phraseId}/review`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Translate text using multi-provider system
   * POST /translate/
   */
  async translate(data: TranslateRequest): Promise<TranslateResponse> {
    try {
      const response = await coreApiClient.post<TranslateResponse>('/translate/', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Log a review in history (MongoDB)
   * POST /review-history/
   */
  async logReview(data: ReviewHistoryCreate): Promise<ReviewHistory> {
    try {
      const response = await coreApiClient.post<ReviewHistory>('/review-history/', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get review history for a user
   * GET /review-history/user/{userId}
   */
  async getReviewHistoryByUser(userId: number): Promise<ReviewHistory[]> {
    try {
      const response = await coreApiClient.get<ReviewHistory[]>(
        `/review-history/user/${userId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get review history for a specific phrase
   * GET /review-history/phrase/{phraseId}
   */
  async getReviewHistoryByPhrase(phraseId: number): Promise<ReviewHistory[]> {
    try {
      const response = await coreApiClient.get<ReviewHistory[]>(
        `/review-history/phrase/${phraseId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and convert to ApiError format
   */
  private handleError(error: unknown): ApiError {
    if (error instanceof AxiosError) {
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const detail = error.response.data?.detail || error.message;
        return { detail, status };
      } else if (error.request) {
        // Request was made but no response received (network error)
        return { detail: error.message };
      }
    }
    return { detail: 'An unexpected error occurred' };
  }
}

// Export singleton instance
export const phrasesService = new PhrasesService();

// Export class for testing or custom instances
export default PhrasesService;
