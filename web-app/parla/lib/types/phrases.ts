// Types for Core Service - Phrases API

export interface Language {
  id: number;
  name: string;
}

export interface Phrase {
  id: number;
  active: boolean;
  source_language: Language;
  target_language: Language;
  user_id: number;
  original_text: string;
  translated_text: string;
  pronunciation: string | null;
  last_reviewed_date: string | null;
  next_review_date: string | null;
  created_at: string;
}

export interface PhraseCreate {
  user_id: number;
  source_language_id: number;
  target_language_id: number;
  original_text: string;
  translated_text: string;
  pronunciation?: string | null;
}

export interface PhraseUpdate {
  original_text?: string;
  translated_text?: string;
  pronunciation?: string | null;
  active?: boolean;
}

export interface ReviewRequest {
  quality: number; // 0-5
}

export interface ReviewResponse {
  phrase_id: number;
  repetition_number: number;
  easiness_factor: number;
  inner_repetition_interval: number;
}

export interface TranslateRequest {
  text: string;
  source_lang: string;
  target_lang: string;
}

export interface TranslateResponse {
  original: string;
  translated_text: string;
  pronunciation: string | null;
  source_lang: string;
  target_lang: string;
  provider: string;
}

export interface ReviewHistoryCreate {
  user_id: number;
  phrase_id: number;
  quality: number;
}

export interface ReviewHistory {
  id: string;
  user_id: number;
  phrase_id: number;
  quality: number;
  reviewed_at: string;
}

// Quality levels for SM-2 algorithm
export enum ReviewQuality {
  COMPLETE_BLACKOUT = 0,
  INCORRECT_EASY_RECALL = 1,
  INCORRECT_HARD_RECALL = 2,
  CORRECT_DIFFICULT = 3,
  CORRECT_HESITATION = 4,
  PERFECT = 5,
}

// Helper type for API errors
export interface ApiError {
  detail: string;
  status?: number;
}
