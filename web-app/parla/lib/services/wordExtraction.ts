/**
 * Word Extraction Service
 * Extracts and processes unique words from phrases
 */

import { Phrase } from '@/lib/types/phrases';

export interface ExtractedWord {
  word: string;
  normalizedWord: string;
  sourcePhrase: string;
  sourcePhraseId: number;
  language: string;
}

/**
 * Convert language name to language code
 */
function getLanguageCode(languageName: string): string {
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
  };
  
  const normalized = languageName.toLowerCase();
  return mapping[normalized] || normalized.substring(0, 2);
}

/**
 * Common stop words to filter out (optional)
 */
const STOP_WORDS: Record<string, Set<string>> = {
  en: new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  ]),
  es: new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero',
    'en', 'de', 'a', 'por', 'para', 'con', 'sin', 'sobre', 'entre', 'hasta',
    'desde', 'es', 'son', 'está', 'están', 'ser', 'estar', 'haber', 'tener',
    'hacer', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
    'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas',
  ]),
};

/**
 * Normalize a word by removing punctuation and converting to lowercase
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!"""''«»\[\]]/g, '')
    .trim();
}

/**
 * Check if a word should be filtered out (stop word or too short)
 */
export function shouldFilterWord(
  word: string,
  language: string,
  filterStopWords: boolean = false,
  minLength: number = 2
): boolean {
  if (word.length < minLength) return true;
  if (!filterStopWords) return false;
  
  const stopWords = STOP_WORDS[language] || new Set();
  return stopWords.has(word);
}

/**
 * Extract words from a single phrase text
 */
export function extractWordsFromText(
  text: string,
  phraseId: number,
  language: string,
  filterStopWords: boolean = false
): ExtractedWord[] {
  // Split by whitespace and extract words
  const words = text.split(/\s+/);
  
  const extractedWords: ExtractedWord[] = [];
  
  // Convert language name to code for stop word filtering
  const languageCode = getLanguageCode(language);
  
  for (const word of words) {
    const normalized = normalizeWord(word);
    
    // Skip if empty or should be filtered
    if (!normalized || shouldFilterWord(normalized, languageCode, filterStopWords)) {
      continue;
    }
    
    extractedWords.push({
      word: word,
      normalizedWord: normalized,
      sourcePhrase: text,
      sourcePhraseId: phraseId,
      language: language,
    });
  }
  
  return extractedWords;
}

/**
 * Extract unique words from multiple phrases
 */
export function extractUniqueWordsFromPhrases(
  phrases: Phrase[],
  options: {
    filterStopWords?: boolean;
    useOriginalText?: boolean;
    useTranslatedText?: boolean;
  } = {}
): Map<string, ExtractedWord> {
  const {
    filterStopWords = false,
    useOriginalText = true,
    useTranslatedText = false,
  } = options;

  const uniqueWords = new Map<string, ExtractedWord>();

  for (const phrase of phrases) {
    // Extract from original text
    if (useOriginalText) {
      const originalWords = extractWordsFromText(
        phrase.original_text,
        phrase.id,
        phrase.source_language.name.toLowerCase(),
        filterStopWords
      );

      for (const word of originalWords) {
        // Use normalized word as key to avoid duplicates
        if (!uniqueWords.has(word.normalizedWord)) {
          uniqueWords.set(word.normalizedWord, word);
        }
      }
    }

    // Extract from translated text
    if (useTranslatedText) {
      const translatedWords = extractWordsFromText(
        phrase.translated_text,
        phrase.id,
        phrase.target_language.name.toLowerCase(),
        filterStopWords
      );

      for (const word of translatedWords) {
        if (!uniqueWords.has(word.normalizedWord)) {
          uniqueWords.set(word.normalizedWord, word);
        }
      }
    }
  }

  return uniqueWords;
}

/**
 * Get word statistics from extracted words
 */
export function getWordStatistics(words: Map<string, ExtractedWord>) {
  const stats = {
    totalWords: words.size,
    byLanguage: new Map<string, number>(),
    averageWordLength: 0,
  };

  let totalLength = 0;

  for (const [, word] of words) {
    // Count by language
    const count = stats.byLanguage.get(word.language) || 0;
    stats.byLanguage.set(word.language, count + 1);

    // Sum lengths
    totalLength += word.normalizedWord.length;
  }

  stats.averageWordLength = words.size > 0 ? totalLength / words.size : 0;

  return stats;
}

/**
 * Sort extracted words by various criteria
 */
export function sortExtractedWords(
  words: ExtractedWord[],
  sortBy: 'alphabetical' | 'length' | 'phrase' = 'alphabetical'
): ExtractedWord[] {
  const sorted = [...words];

  switch (sortBy) {
    case 'alphabetical':
      sorted.sort((a, b) => a.normalizedWord.localeCompare(b.normalizedWord));
      break;
    case 'length':
      sorted.sort((a, b) => b.normalizedWord.length - a.normalizedWord.length);
      break;
    case 'phrase':
      sorted.sort((a, b) => a.sourcePhraseId - b.sourcePhraseId);
      break;
  }

  return sorted;
}
