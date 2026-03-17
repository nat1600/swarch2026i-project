/**
 * Dictionary API Service
 * Integrates with Free Dictionary API to fetch word definitions
 */

import { GrammaticalCategory } from '@/lib/types/dictionary';

const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries';

export interface ApiDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface ApiMeaning {
  partOfSpeech: string;
  definitions: ApiDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface ApiPhonetic {
  text?: string;
  audio?: string;
}

export interface ApiWordEntry {
  word: string;
  phonetic?: string;
  phonetics: ApiPhonetic[];
  meanings: ApiMeaning[];
  sourceUrls?: string[];
}

export interface ProcessedDefinition {
  partOfSpeech: GrammaticalCategory;
  definition: string;
  example?: string;
}

export interface WordLookupResult {
  word: string;
  pronunciation?: string;
  audioUrl?: string;
  definitions: ProcessedDefinition[];
  synonyms: string[];
  antonyms: string[];
  found: boolean;
  error?: string;
}

/**
 * Map API part of speech to our GrammaticalCategory
 */
function mapPartOfSpeech(apiPartOfSpeech: string): GrammaticalCategory {
  const normalized = apiPartOfSpeech.toLowerCase();
  
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
  };
  
  return mapping[normalized] || 'other';
}

/**
 * Fetch word definition from Free Dictionary API
 */
export async function fetchWordDefinition(
  word: string,
  language: string = 'en',
  maxDefinitions: number = 3
): Promise<WordLookupResult> {
  const url = `${DICTIONARY_API_URL}/${language}/${encodeURIComponent(word.toLowerCase())}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          word,
          definitions: [],
          synonyms: [],
          antonyms: [],
          found: false,
          error: 'Word not found in dictionary',
        };
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: ApiWordEntry[] = await response.json();
    
    if (!data || data.length === 0) {
      return {
        word,
        definitions: [],
        synonyms: [],
        antonyms: [],
        found: false,
        error: 'No definitions found',
      };
    }
    
    const entry = data[0];
    
    // Extract pronunciation and audio
    const pronunciation = entry.phonetic || entry.phonetics[0]?.text;
    const audioUrl = entry.phonetics.find(p => p.audio)?.audio;
    
    // Process definitions (limit to maxDefinitions per part of speech)
    const processedDefinitions: ProcessedDefinition[] = [];
    const allSynonyms = new Set<string>();
    const allAntonyms = new Set<string>();
    
    for (const meaning of entry.meanings) {
      const partOfSpeech = mapPartOfSpeech(meaning.partOfSpeech);
      
      // Add synonyms and antonyms from meaning level
      meaning.synonyms?.forEach(syn => allSynonyms.add(syn));
      meaning.antonyms?.forEach(ant => allAntonyms.add(ant));
      
      // Take first N definitions for this part of speech
      const defsToTake = meaning.definitions.slice(0, maxDefinitions);
      
      for (const def of defsToTake) {
        processedDefinitions.push({
          partOfSpeech,
          definition: def.definition,
          example: def.example,
        });
        
        // Add synonyms and antonyms from definition level
        def.synonyms?.forEach(syn => allSynonyms.add(syn));
        def.antonyms?.forEach(ant => allAntonyms.add(ant));
      }
      
      // Stop if we have enough definitions overall
      if (processedDefinitions.length >= maxDefinitions) {
        break;
      }
    }
    
    return {
      word: entry.word,
      pronunciation,
      audioUrl,
      definitions: processedDefinitions.slice(0, maxDefinitions),
      synonyms: Array.from(allSynonyms).slice(0, 5),
      antonyms: Array.from(allAntonyms).slice(0, 5),
      found: true,
    };
    
  } catch (error) {
    console.error(`Error fetching definition for "${word}":`, error);
    return {
      word,
      definitions: [],
      synonyms: [],
      antonyms: [],
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch definitions for multiple words with rate limiting
 */
export async function fetchMultipleDefinitions(
  words: string[],
  language: string = 'en',
  maxDefinitions: number = 3,
  delayMs: number = 500,
  onProgress?: (current: number, total: number, word: string) => void
): Promise<Map<string, WordLookupResult>> {
  const results = new Map<string, WordLookupResult>();
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    if (onProgress) {
      onProgress(i + 1, words.length, word);
    }
    
    const result = await fetchWordDefinition(word, language, maxDefinitions);
    results.set(word, result);
    
    // Rate limiting: wait between requests
    if (i < words.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Check if a language is supported by the Free Dictionary API
 */
export function isSupportedLanguage(language: string): boolean {
  const supported = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'ar'];
  return supported.includes(language.toLowerCase());
}

/**
 * Get language code from language name
 */
export function getLanguageCode(languageName: string): string {
  const mapping: Record<string, string> = {
    'english': 'en',
    'spanish': 'es',
    'español': 'es',
    'french': 'fr',
    'français': 'fr',
    'german': 'de',
    'deutsch': 'de',
    'italian': 'it',
    'italiano': 'it',
    'portuguese': 'pt',
    'português': 'pt',
    'russian': 'ru',
    'русский': 'ru',
    'japanese': 'ja',
    '日本語': 'ja',
    'korean': 'ko',
    '한국어': 'ko',
    'arabic': 'ar',
    'العربية': 'ar',
  };
  
  const normalized = languageName.toLowerCase();
  return mapping[normalized] || normalized.substring(0, 2);
}
