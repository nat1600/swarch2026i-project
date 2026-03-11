// Translation Service
// Combines MyMemory API (translations) + Free Dictionary API (definitions)

import { GrammaticalCategory } from '@/lib/types/dictionary';

// API Configuration
const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';
const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries';

// Email for MyMemory API (increases limit from 5,000 to 50,000 chars/day)
const MYMEMORY_EMAIL = process.env.NEXT_PUBLIC_MYMEMORY_EMAIL || 'parla@example.com';

// Types for API responses
export interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
}

export interface DictionaryAPIResponse {
  word: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  origin?: string;
}

export interface TranslationMatch {
  id: string;
  segment: string;
  translation: string;
  source: string;
  target: string;
  quality: number;
  match: number;
}

export interface MyMemoryResponse {
  responseData: {
    translatedText: string;
    match: number;
  };
  responseStatus: number;
  matches: TranslationMatch[];
  quotaFinished: boolean;
}

// Combined result from both APIs
export interface WordLookupResult {
  word: string;
  translation: string;
  pronunciation?: string;
  audioUrl?: string;
  definitions: {
    meaning: string;
    partOfSpeech: GrammaticalCategory;
    example?: string;
  }[];
  examples: {
    sentence: string;
    translation: string;
  }[];
  synonyms: string[];
  antonyms: string[];
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  error?: string;
}

// Map part of speech to GrammaticalCategory
const mapPartOfSpeech = (pos: string): GrammaticalCategory => {
  const mapping: Record<string, GrammaticalCategory> = {
    'noun': 'noun',
    'verb': 'verb',
    'adjective': 'adjective',
    'adverb': 'adverb',
    'pronoun': 'pronoun',
    'preposition': 'preposition',
    'conjunction': 'conjunction',
    'interjection': 'interjection',
    'exclamation': 'interjection',
    'determiner': 'other',
    'article': 'other',
  };
  return mapping[pos.toLowerCase()] || 'other';
};

/**
 * Get translation from MyMemory API
 */
export const getTranslation = async (
  text: string,
  sourceLang: string = 'en',
  targetLang: string = 'es'
): Promise<{ translation: string; confidence: number; matches: TranslationMatch[] }> => {
  try {
    const langPair = `${sourceLang}|${targetLang}`;
    const url = `${MYMEMORY_API_URL}?q=${encodeURIComponent(text)}&langpair=${langPair}&de=${encodeURIComponent(MYMEMORY_EMAIL)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.status}`);
    }
    
    const data: MyMemoryResponse = await response.json();
    
    if (data.responseStatus !== 200) {
      throw new Error('Translation failed');
    }
    
    if (data.quotaFinished) {
      throw new Error('Daily quota exceeded');
    }
    
    return {
      translation: data.responseData.translatedText,
      confidence: data.responseData.match,
      matches: data.matches || [],
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      translation: '',
      confidence: 0,
      matches: [],
    };
  }
};

/**
 * Get definition from Free Dictionary API
 */
export const getDefinition = async (
  word: string,
  language: string = 'en'
): Promise<DictionaryAPIResponse | null> => {
  try {
    const url = `${DICTIONARY_API_URL}/${language}/${encodeURIComponent(word.toLowerCase())}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Dictionary API error: ${response.status}`);
    }
    
    const data: DictionaryAPIResponse[] = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Definition error:', error);
    return null;
  }
};

/**
 * Complete word lookup - combines translation + definition
 */
export const lookupWord = async (
  word: string,
  sourceLang: string = 'en',
  targetLang: string = 'es'
): Promise<WordLookupResult> => {
  const result: WordLookupResult = {
    word: word.trim(),
    translation: '',
    definitions: [],
    examples: [],
    synonyms: [],
    antonyms: [],
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    confidence: 0,
  };

  try {
    // Fetch both APIs in parallel
    const [translationResult, definitionResult] = await Promise.all([
      getTranslation(word, sourceLang, targetLang),
      getDefinition(word, sourceLang),
    ]);

    // Process translation
    result.translation = translationResult.translation;
    result.confidence = translationResult.confidence;

    // Process definition
    if (definitionResult) {
      // Pronunciation
      result.pronunciation = definitionResult.phonetic || 
        definitionResult.phonetics.find(p => p.text)?.text;
      
      // Audio URL
      const audioPhonetic = definitionResult.phonetics.find(p => p.audio && p.audio.length > 0);
      if (audioPhonetic?.audio) {
        result.audioUrl = audioPhonetic.audio.startsWith('//')
          ? `https:${audioPhonetic.audio}`
          : audioPhonetic.audio;
      }

      // Definitions and examples
      const allSynonyms = new Set<string>();
      const allAntonyms = new Set<string>();

      definitionResult.meanings.forEach(meaning => {
        // Add synonyms/antonyms from meaning level
        meaning.synonyms.forEach(s => allSynonyms.add(s));
        meaning.antonyms.forEach(a => allAntonyms.add(a));

        meaning.definitions.forEach(def => {
          result.definitions.push({
            meaning: def.definition,
            partOfSpeech: mapPartOfSpeech(meaning.partOfSpeech),
            example: def.example,
          });

          // Add example if available
          if (def.example) {
            result.examples.push({
              sentence: def.example,
              translation: '',
            });
          }

          // Add synonyms/antonyms from definition level
          def.synonyms.forEach(s => allSynonyms.add(s));
          def.antonyms.forEach(a => allAntonyms.add(a));
        });
      });

      result.synonyms = Array.from(allSynonyms).slice(0, 10);
      result.antonyms = Array.from(allAntonyms).slice(0, 10);
    }

    return result;
  } catch (error) {
    console.error('Word lookup error:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
};

/**
 * Batch lookup multiple words (with rate limiting)
 */
export const batchLookupWords = async (
  words: string[],
  sourceLang: string = 'en',
  targetLang: string = 'es',
  onProgress?: (current: number, total: number) => void
): Promise<WordLookupResult[]> => {
  const results: WordLookupResult[] = [];
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < words.length; i++) {
    const result = await lookupWord(words[i], sourceLang, targetLang);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, words.length);
    }
    
    // Rate limiting: wait 200ms between requests to avoid hitting limits
    if (i < words.length - 1) {
      await delay(200);
    }
  }
  
  return results;
};

/**
 * Check if translation quota is available
 */
export const checkQuotaStatus = async (): Promise<{ available: boolean; message: string }> => {
  try {
    const result = await getTranslation('test', 'en', 'es');
    return {
      available: result.translation.length > 0,
      message: result.translation.length > 0 ? 'Quota available' : 'Quota may be exhausted',
    };
  } catch (error) {
    return {
      available: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
