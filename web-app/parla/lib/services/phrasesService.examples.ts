/**
 * Examples of how to use the PhrasesService
 * This file demonstrates all available methods
 */

import { phrasesService } from './phrasesService';
import { ReviewQuality } from '@/lib/types/phrases';

// ============================================
// Example 1: Get all phrases
// ============================================
export async function exampleGetAllPhrases() {
  try {
    const phrases = await phrasesService.getAllPhrases();
    console.log('All phrases:', phrases);
    return phrases;
  } catch (error) {
    console.error('Error fetching phrases:', error);
    throw error;
  }
}

// ============================================
// Example 2: Create a new phrase
// ============================================
export async function exampleCreatePhrase() {
  try {
    const newPhrase = await phrasesService.createPhrase({
      user_id: 1,
      source_language_id: 1, // English
      target_language_id: 2, // Spanish
      original_text: 'Hello, how are you?',
      translated_text: 'Hola, ¿cómo estás?',
      pronunciation: '/həˈloʊ/',
    });
    console.log('Created phrase:', newPhrase);
    return newPhrase;
  } catch (error) {
    console.error('Error creating phrase:', error);
    throw error;
  }
}

// ============================================
// Example 3: Translate text before creating phrase
// ============================================
export async function exampleTranslateAndCreatePhrase(
  text: string,
  userId: number,
  sourceLangId: number,
  targetLangId: number
) {
  try {
    // Step 1: Translate the text
    const translation = await phrasesService.translate({
      text,
      source_lang: 'en',
      target_lang: 'es',
    });

    console.log('Translation result:', translation);

    // Step 2: Create phrase with translation
    const phrase = await phrasesService.createPhrase({
      user_id: userId,
      source_language_id: sourceLangId,
      target_language_id: targetLangId,
      original_text: translation.original,
      translated_text: translation.translated_text,
      pronunciation: translation.pronunciation,
    });

    console.log('Created phrase with translation:', phrase);
    return phrase;
  } catch (error) {
    console.error('Error in translate and create:', error);
    throw error;
  }
}

// ============================================
// Example 4: Get phrases due for review
// ============================================
export async function exampleGetDuePhrases(userId: number) {
  try {
    const duePhrases = await phrasesService.getDuePhrases(userId);
    console.log(`Found ${duePhrases.length} phrases due for review`);
    return duePhrases;
  } catch (error) {
    console.error('Error fetching due phrases:', error);
    throw error;
  }
}

// ============================================
// Example 5: Review a phrase (flashcard)
// ============================================
export async function exampleReviewPhrase(phraseId: number, quality: ReviewQuality) {
  try {
    // Submit review
    const reviewResult = await phrasesService.reviewPhrase(phraseId, quality);
    console.log('Review result:', reviewResult);

    // Log review in history
    await phrasesService.logReview({
      user_id: 1, // Replace with actual user ID
      phrase_id: phraseId,
      quality,
    });

    return reviewResult;
  } catch (error) {
    console.error('Error reviewing phrase:', error);
    throw error;
  }
}

// ============================================
// Example 6: Complete flashcard review session
// ============================================
export async function exampleFlashcardSession(userId: number) {
  try {
    // Get phrases due for review
    const duePhrases = await phrasesService.getDuePhrases(userId);

    if (duePhrases.length === 0) {
      console.log('No phrases due for review!');
      return;
    }

    console.log(`Starting review session with ${duePhrases.length} phrases`);

    // Review each phrase (in a real app, this would be interactive)
    for (const phrase of duePhrases) {
      console.log(`\nReviewing: ${phrase.original_text} → ${phrase.translated_text}`);
      
      // Simulate user response (in real app, get from user input)
      const quality = ReviewQuality.CORRECT_HESITATION; // 4

      const result = await phrasesService.reviewPhrase(phrase.id, quality);
      
      console.log(`Next review in ${result.inner_repetition_interval} days`);
      console.log(`Easiness factor: ${result.easiness_factor}`);
    }

    console.log('\nReview session completed!');
  } catch (error) {
    console.error('Error in flashcard session:', error);
    throw error;
  }
}

// ============================================
// Example 7: Get phrase by ID
// ============================================
export async function exampleGetPhraseById(phraseId: number) {
  try {
    const phrase = await phrasesService.getPhraseById(phraseId);
    console.log('Phrase details:', phrase);
    return phrase;
  } catch (error) {
    console.error('Error fetching phrase:', error);
    throw error;
  }
}

// ============================================
// Example 8: Delete a phrase
// ============================================
export async function exampleDeletePhrase(phraseId: number) {
  try {
    await phrasesService.deletePhrase(phraseId);
    console.log(`Phrase ${phraseId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting phrase:', error);
    throw error;
  }
}

// ============================================
// Example 9: Get review history for user
// ============================================
export async function exampleGetUserReviewHistory(userId: number) {
  try {
    const history = await phrasesService.getReviewHistoryByUser(userId);
    console.log(`User has ${history.length} review records`);
    return history;
  } catch (error) {
    console.error('Error fetching review history:', error);
    throw error;
  }
}

// ============================================
// Example 10: Get review history for a phrase
// ============================================
export async function exampleGetPhraseReviewHistory(phraseId: number) {
  try {
    const history = await phrasesService.getReviewHistoryByPhrase(phraseId);
    console.log(`Phrase has been reviewed ${history.length} times`);
    return history;
  } catch (error) {
    console.error('Error fetching phrase history:', error);
    throw error;
  }
}

// ============================================
// Example 11: Complete workflow - Capture word from subtitle
// ============================================
export async function exampleCaptureWordFromSubtitle(
  word: string,
  userId: number
) {
  try {
    console.log(`Capturing word: "${word}"`);

    // Step 1: Translate the word
    const translation = await phrasesService.translate({
      text: word,
      source_lang: 'en',
      target_lang: 'es',
    });

    console.log(`Translation: ${translation.translated_text}`);
    console.log(`Provider: ${translation.provider}`);

    // Step 2: Create phrase
    const phrase = await phrasesService.createPhrase({
      user_id: userId,
      source_language_id: 1, // English
      target_language_id: 2, // Spanish
      original_text: translation.original,
      translated_text: translation.translated_text,
      pronunciation: translation.pronunciation,
    });

    console.log(`Word saved! ID: ${phrase.id}`);
    return phrase;
  } catch (error) {
    console.error('Error capturing word:', error);
    throw error;
  }
}
