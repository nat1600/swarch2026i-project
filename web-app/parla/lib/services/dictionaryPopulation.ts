/**
 * Dictionary Population Service
 * Orchestrates the process of fetching phrases, extracting words, and populating dictionary
 */

import { phrasesService } from './phrasesService';
import { extractUniqueWordsFromPhrases, ExtractedWord } from './wordExtraction';
import { 
  fetchMultipleDefinitions, 
  WordLookupResult,
  getLanguageCode,
  isSupportedLanguage 
} from './dictionaryApiService';
import { DictionaryWord, Language, Difficulty } from '@/lib/types/dictionary';
import { Phrase } from '@/lib/types/phrases';

export interface PopulationProgress {
  stage: 'fetching_phrases' | 'extracting_words' | 'fetching_definitions' | 'creating_entries' | 'complete';
  currentStep: number;
  totalSteps: number;
  currentWord?: string;
  message: string;
}

export interface PopulationResult {
  success: boolean;
  totalPhrases: number;
  totalWords: number;
  successfulDefinitions: number;
  failedDefinitions: number;
  dictionaryEntries: DictionaryWord[];
  errors: string[];
}

function estimateDifficulty(word: string): Difficulty {
  const length = word.length;
  if (length <= 4) return 'easy';
  if (length <= 7) return 'medium';
  return 'hard';
}

function createDictionaryEntry(
  extractedWord: ExtractedWord,
  lookupResult: WordLookupResult,
  targetLanguage: Language
): DictionaryWord | null {
  if (!lookupResult.found || lookupResult.definitions.length === 0) {
    return null;
  }

  const primaryDefinition = lookupResult.definitions[0];

  return {
    id: `word-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    word: lookupResult.word,
    translation: '',
    pronunciation: lookupResult.pronunciation,
    audioUrl: lookupResult.audioUrl,
    definitions: lookupResult.definitions.map((def, index) => ({
      id: `def-${index}-${Date.now()}`,
      meaning: def.definition,
      partOfSpeech: def.partOfSpeech,
      example: def.example,
    })),
    examples: extractedWord.sourcePhrase ? [{
      id: `ex-${Date.now()}`,
      sentence: extractedWord.sourcePhrase,
      translation: '',
    }] : [],
    synonyms: lookupResult.synonyms,
    antonyms: lookupResult.antonyms,
    language: extractedWord.language as Language,
    targetLanguage: targetLanguage,
    difficulty: estimateDifficulty(extractedWord.normalizedWord),
    wordType: primaryDefinition.partOfSpeech,
    isFavorite: false,
    isLearned: false,
    reviewCount: 0,
    createdAt: new Date(),
    tags: [`from-phrase-${extractedWord.sourcePhraseId}`],
  };
}

export async function populateDictionaryFromPhrases(
  userId: number,
  options: {
    filterStopWords?: boolean;
    maxDefinitionsPerWord?: number;
    targetLanguage?: Language;
    onProgress?: (progress: PopulationProgress) => void;
  } = {}
): Promise<PopulationResult> {
  const {
    filterStopWords = true,
    maxDefinitionsPerWord = 3,
    targetLanguage = 'es' as Language,
    onProgress,
  } = options;

  const result: PopulationResult = {
    success: false,
    totalPhrases: 0,
    totalWords: 0,
    successfulDefinitions: 0,
    failedDefinitions: 0,
    dictionaryEntries: [],
    errors: [],
  };

  try {
    if (onProgress) {
      onProgress({
        stage: 'fetching_phrases',
        currentStep: 0,
        totalSteps: 1,
        message: 'Fetching your phrases...',
      });
    }

    const phrases = await phrasesService.getAllPhrases();
    const userPhrases = phrases.filter(p => p.user_id === userId && p.active);
    result.totalPhrases = userPhrases.length;

    if (userPhrases.length === 0) {
      result.errors.push('No phrases found for user');
      return result;
    }

    if (onProgress) {
      onProgress({
        stage: 'extracting_words',
        currentStep: 0,
        totalSteps: 1,
        message: `Extracting words from ${userPhrases.length} phrases...`,
      });
    }

    const uniqueWordsMap = extractUniqueWordsFromPhrases(userPhrases, {
      filterStopWords,
      useOriginalText: true,
      useTranslatedText: false,
    });

    const uniqueWords = Array.from(uniqueWordsMap.values());
    result.totalWords = uniqueWords.length;

    if (uniqueWords.length === 0) {
      result.errors.push('No words extracted from phrases');
      return result;
    }

    if (onProgress) {
      onProgress({
        stage: 'fetching_definitions',
        currentStep: 0,
        totalSteps: uniqueWords.length,
        message: `Fetching definitions for ${uniqueWords.length} words...`,
      });
    }

    const wordsList = uniqueWords.map(w => w.normalizedWord);
    const sampleLanguage = uniqueWords[0]?.language || 'en';
    const languageCode = getLanguageCode(sampleLanguage);

    if (!isSupportedLanguage(languageCode)) {
      result.errors.push(`Language "${languageCode}" is not supported`);
      return result;
    }

    const definitions = await fetchMultipleDefinitions(
      wordsList,
      languageCode,
      maxDefinitionsPerWord,
      500,
      (current, total, word) => {
        if (onProgress) {
          onProgress({
            stage: 'fetching_definitions',
            currentStep: current,
            totalSteps: total,
            currentWord: word,
            message: `Fetching definition for "${word}" (${current}/${total})...`,
          });
        }
      }
    );

    if (onProgress) {
      onProgress({
        stage: 'creating_entries',
        currentStep: 0,
        totalSteps: uniqueWords.length,
        message: 'Creating dictionary entries...',
      });
    }

    for (let i = 0; i < uniqueWords.length; i++) {
      const extractedWord = uniqueWords[i];
      const lookupResult = definitions.get(extractedWord.normalizedWord);

      if (onProgress) {
        onProgress({
          stage: 'creating_entries',
          currentStep: i + 1,
          totalSteps: uniqueWords.length,
          currentWord: extractedWord.normalizedWord,
          message: `Processing "${extractedWord.normalizedWord}"...`,
        });
      }

      if (!lookupResult || !lookupResult.found) {
        result.failedDefinitions++;
        continue;
      }

      const dictionaryEntry = createDictionaryEntry(
        extractedWord,
        lookupResult,
        targetLanguage
      );

      if (dictionaryEntry) {
        result.dictionaryEntries.push(dictionaryEntry);
        result.successfulDefinitions++;
      } else {
        result.failedDefinitions++;
      }
    }

    if (onProgress) {
      onProgress({
        stage: 'complete',
        currentStep: result.successfulDefinitions,
        totalSteps: result.totalWords,
        message: `Complete! Created ${result.successfulDefinitions} dictionary entries.`,
      });
    }

    result.success = result.successfulDefinitions > 0;
    return result;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

export async function populateDictionaryFromPhrasesArray(
  phrases: Phrase[],
  options: {
    filterStopWords?: boolean;
    maxDefinitionsPerWord?: number;
    targetLanguage?: Language;
    onProgress?: (progress: PopulationProgress) => void;
  } = {}
): Promise<PopulationResult> {
  const {
    filterStopWords = true,
    maxDefinitionsPerWord = 3,
    targetLanguage = 'es' as Language,
    onProgress,
  } = options;

  const result: PopulationResult = {
    success: false,
    totalPhrases: phrases.length,
    totalWords: 0,
    successfulDefinitions: 0,
    failedDefinitions: 0,
    dictionaryEntries: [],
    errors: [],
  };

  try {
    const uniqueWordsMap = extractUniqueWordsFromPhrases(phrases, {
      filterStopWords,
      useOriginalText: true,
      useTranslatedText: false,
    });

    const uniqueWords = Array.from(uniqueWordsMap.values());
    result.totalWords = uniqueWords.length;

    const wordsList = uniqueWords.map(w => w.normalizedWord);
    const sampleLanguage = uniqueWords[0]?.language || 'en';
    const languageCode = getLanguageCode(sampleLanguage);

    const definitions = await fetchMultipleDefinitions(
      wordsList,
      languageCode,
      maxDefinitionsPerWord,
      500,
      onProgress ? (current, total, word) => {
        onProgress({
          stage: 'fetching_definitions',
          currentStep: current,
          totalSteps: total,
          currentWord: word,
          message: `Fetching "${word}" (${current}/${total})...`,
        });
      } : undefined
    );

    for (const extractedWord of uniqueWords) {
      const lookupResult = definitions.get(extractedWord.normalizedWord);

      if (!lookupResult || !lookupResult.found) {
        result.failedDefinitions++;
        continue;
      }

      const dictionaryEntry = createDictionaryEntry(
        extractedWord,
        lookupResult,
        targetLanguage
      );

      if (dictionaryEntry) {
        result.dictionaryEntries.push(dictionaryEntry);
        result.successfulDefinitions++;
      }
    }

    result.success = result.successfulDefinitions > 0;
    return result;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}
