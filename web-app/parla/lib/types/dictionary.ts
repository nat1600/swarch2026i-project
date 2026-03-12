// Dictionary Types
// Types for dictionary words and related data structures

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'nl' | 'pl' | 'ru' | 'ja' | 'zh' | 'ko' | 'ar';

export type GrammaticalCategory = 
  | 'noun' 
  | 'verb' 
  | 'adjective' 
  | 'adverb' 
  | 'pronoun' 
  | 'preposition' 
  | 'conjunction' 
  | 'interjection' 
  | 'other';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WordDefinition {
  id: string;
  meaning: string;
  partOfSpeech: GrammaticalCategory;
  example?: string;
  usage?: string;
}

export interface WordExample {
  id: string;
  sentence: string;
  translation: string;
}

export interface DictionaryWord {
  id: string;
  word: string;
  translation: string;
  pronunciation?: string;
  audioUrl?: string;
  definitions: WordDefinition[];
  examples: WordExample[];
  synonyms: string[];
  antonyms: string[];
  language: Language;
  targetLanguage: Language;
  difficulty: Difficulty;
  wordType: GrammaticalCategory;
  isFavorite: boolean;
  isLearned: boolean;
  reviewCount: number;
  createdAt: Date;
  updatedAt?: Date;
  tags?: string[];
}

export interface DictionaryFilters {
  language: Language | 'all';
  wordType: GrammaticalCategory | 'all';
  difficulty: Difficulty | 'all';
  status: 'all' | 'learned' | 'learning' | 'favorites';
}

export type DictionarySort = 
  | 'alphabetical' 
  | 'date' 
  | 'difficulty' 
  | 'reviewCount' 
  | 'favorites';

export interface DictionaryStats {
  total: number;
  learned: number;
  favorites: number;
  byLanguage: Record<Language, number>;
  byDifficulty: Record<Difficulty, number>;
  byWordType: Record<GrammaticalCategory, number>;
}

// Constants
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  ru: 'Русский',
  ja: '日本語',
  zh: '中文',
  ko: '한국어',
  ar: 'العربية',
};

export const GRAMMATICAL_CATEGORY_NAMES: Record<GrammaticalCategory, string> = {
  noun: 'Sustantivo',
  verb: 'Verbo',
  adjective: 'Adjetivo',
  adverb: 'Adverbio',
  pronoun: 'Pronombre',
  preposition: 'Preposición',
  conjunction: 'Conjunción',
  interjection: 'Interjección',
  other: 'Otro',
};

export const GRAMMATICAL_CATEGORY_COLORS: Record<GrammaticalCategory, string> = {
  noun: 'bg-[#2D83A6] text-white border-[#1f6d8e]',
  verb: 'bg-[#BF0436] text-white border-[#8C0327]',
  adjective: 'bg-[#F5A623] text-white border-[#D08B1B]',
  adverb: 'bg-[#10b981] text-white border-[#059669]',
  pronoun: 'bg-[#A9CBD9] text-[#254159] border-[#7AAEC2]',
  preposition: 'bg-[#8b5cf6] text-white border-[#7c3aed]',
  conjunction: 'bg-[#ec4899] text-white border-[#db2777]',
  interjection: 'bg-[#f59e0b] text-white border-[#d97706]',
  other: 'bg-[#6b7280] text-white border-[#4b5563]',
};

export const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'bg-green-500 text-white',
  medium: 'bg-yellow-500 text-white',
  hard: 'bg-red-500 text-white',
};

export const DICTIONARY_SORT_NAMES: Record<DictionarySort, string> = {
  alphabetical: 'Alfabético',
  date: 'Fecha',
  difficulty: 'Dificultad',
  reviewCount: 'Más revisadas',
  favorites: 'Favoritas',
};
