/**
 * Dictionary Population Examples
 * Demonstrates how to use the dictionary population service with sample phrases
 */

import { Phrase } from '@/lib/types/phrases';
import { populateDictionaryFromPhrasesArray, PopulationProgress } from './dictionaryPopulation';

/**
 * Sample phrases for testing
 */
export const SAMPLE_PHRASES: Phrase[] = [
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
    original_text: 'Learning new languages opens doors to different cultures',
    translated_text: 'Aprender nuevos idiomas abre puertas a diferentes culturas',
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
    original_text: 'Practice makes perfect when studying vocabulary',
    translated_text: 'La práctica hace al maestro cuando se estudia vocabulario',
    pronunciation: null,
    last_reviewed_date: null,
    next_review_date: null,
    created_at: '2026-03-12T02:00:00Z',
  },
  {
    id: 4,
    active: true,
    source_language: { id: 1, name: 'English' },
    target_language: { id: 2, name: 'Spanish' },
    user_id: 1,
    original_text: 'Reading books helps improve comprehension skills',
    translated_text: 'Leer libros ayuda a mejorar las habilidades de comprensión',
    pronunciation: null,
    last_reviewed_date: null,
    next_review_date: null,
    created_at: '2026-03-12T03:00:00Z',
  },
  {
    id: 5,
    active: true,
    source_language: { id: 1, name: 'English' },
    target_language: { id: 2, name: 'Spanish' },
    user_id: 1,
    original_text: 'Technology revolutionizes education and communication',
    translated_text: 'La tecnología revoluciona la educación y la comunicación',
    pronunciation: null,
    last_reviewed_date: null,
    next_review_date: null,
    created_at: '2026-03-12T04:00:00Z',
  },
  {
    id: 6,
    active: true,
    source_language: { id: 1, name: 'English' },
    target_language: { id: 2, name: 'Spanish' },
    user_id: 1,
    original_text: 'Music connects people across different backgrounds',
    translated_text: 'La música conecta a las personas de diferentes orígenes',
    pronunciation: null,
    last_reviewed_date: null,
    next_review_date: null,
    created_at: '2026-03-12T05:00:00Z',
  },
  {
    id: 7,
    active: true,
    source_language: { id: 1, name: 'English' },
    target_language: { id: 2, name: 'Spanish' },
    user_id: 1,
    original_text: 'Travel broadens perspective and understanding',
    translated_text: 'Viajar amplía la perspectiva y la comprensión',
    pronunciation: null,
    last_reviewed_date: null,
    next_review_date: null,
    created_at: '2026-03-12T06:00:00Z',
  },
];

/**
 * Example 1: Basic dictionary population with progress tracking
 */
export async function exampleBasicPopulation() {
  console.log('=== Example 1: Basic Dictionary Population ===\n');

  const result = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
    filterStopWords: true,
    maxDefinitionsPerWord: 3,
    targetLanguage: 'es',
    onProgress: (progress: PopulationProgress) => {
      console.log(`[${progress.stage}] ${progress.message}`);
      if (progress.currentWord) {
        console.log(`  → Processing: ${progress.currentWord}`);
      }
    },
  });

  console.log('\n=== Results ===');
  console.log(`Success: ${result.success}`);
  console.log(`Total Phrases: ${result.totalPhrases}`);
  console.log(`Total Words Extracted: ${result.totalWords}`);
  console.log(`Successful Definitions: ${result.successfulDefinitions}`);
  console.log(`Failed Definitions: ${result.failedDefinitions}`);
  console.log(`Dictionary Entries Created: ${result.dictionaryEntries.length}`);

  if (result.errors.length > 0) {
    console.log('\n=== Errors ===');
    result.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  return result;
}

/**
 * Example 2: Display dictionary entries with details
 */
export async function exampleDisplayDictionaryEntries() {
  console.log('=== Example 2: Display Dictionary Entries ===\n');

  const result = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
    filterStopWords: true,
    maxDefinitionsPerWord: 3,
    targetLanguage: 'es',
  });

  if (!result.success) {
    console.log('Failed to populate dictionary');
    return;
  }

  console.log(`\n=== ${result.dictionaryEntries.length} Dictionary Entries ===\n`);

  result.dictionaryEntries.slice(0, 10).forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.word.toUpperCase()}`);
    console.log(`   Language: ${entry.language}`);
    console.log(`   Difficulty: ${entry.difficulty}`);
    console.log(`   Type: ${entry.wordType}`);
    
    if (entry.pronunciation) {
      console.log(`   Pronunciation: ${entry.pronunciation}`);
    }
    
    console.log(`   Definitions (${entry.definitions.length}):`);
    entry.definitions.forEach((def, defIndex) => {
      console.log(`     ${defIndex + 1}. [${def.partOfSpeech}] ${def.meaning}`);
      if (def.example) {
        console.log(`        Example: "${def.example}"`);
      }
    });

    if (entry.synonyms.length > 0) {
      console.log(`   Synonyms: ${entry.synonyms.join(', ')}`);
    }

    if (entry.examples.length > 0) {
      console.log(`   From phrase: "${entry.examples[0].sentence}"`);
    }

    console.log('');
  });

  return result;
}

/**
 * Example 3: Filter and search dictionary entries
 */
export async function exampleSearchDictionary() {
  console.log('=== Example 3: Search Dictionary ===\n');

  const result = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
    filterStopWords: true,
    maxDefinitionsPerWord: 3,
  });

  if (!result.success) {
    console.log('Failed to populate dictionary');
    return;
  }

  const entries = result.dictionaryEntries;

  // Search by word type
  console.log('=== Nouns ===');
  const nouns = entries.filter(e => e.wordType === 'noun');
  console.log(`Found ${nouns.length} nouns:`);
  nouns.slice(0, 5).forEach(n => console.log(`  - ${n.word}`));

  console.log('\n=== Verbs ===');
  const verbs = entries.filter(e => e.wordType === 'verb');
  console.log(`Found ${verbs.length} verbs:`);
  verbs.slice(0, 5).forEach(v => console.log(`  - ${v.word}`));

  console.log('\n=== Adjectives ===');
  const adjectives = entries.filter(e => e.wordType === 'adjective');
  console.log(`Found ${adjectives.length} adjectives:`);
  adjectives.slice(0, 5).forEach(a => console.log(`  - ${a.word}`));

  // Search by difficulty
  console.log('\n=== By Difficulty ===');
  const easy = entries.filter(e => e.difficulty === 'easy').length;
  const medium = entries.filter(e => e.difficulty === 'medium').length;
  const hard = entries.filter(e => e.difficulty === 'hard').length;
  console.log(`Easy: ${easy}, Medium: ${medium}, Hard: ${hard}`);

  return result;
}

/**
 * Example 4: Without stop words filtering
 */
export async function exampleWithoutStopWords() {
  console.log('=== Example 4: Without Stop Words Filtering ===\n');

  const resultWithFilter = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
    filterStopWords: true,
    maxDefinitionsPerWord: 3,
  });

  const resultWithoutFilter = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
    filterStopWords: false,
    maxDefinitionsPerWord: 3,
  });

  console.log('With stop words filter:');
  console.log(`  Total words: ${resultWithFilter.totalWords}`);
  console.log(`  Successful: ${resultWithFilter.successfulDefinitions}`);

  console.log('\nWithout stop words filter:');
  console.log(`  Total words: ${resultWithoutFilter.totalWords}`);
  console.log(`  Successful: ${resultWithoutFilter.successfulDefinitions}`);

  console.log(`\nDifference: ${resultWithoutFilter.totalWords - resultWithFilter.totalWords} more words`);
}

/**
 * Example 5: Export dictionary to JSON
 */
export async function exampleExportDictionary() {
  console.log('=== Example 5: Export Dictionary ===\n');

  const result = await populateDictionaryFromPhrasesArray(SAMPLE_PHRASES, {
    filterStopWords: true,
    maxDefinitionsPerWord: 3,
  });

  if (!result.success) {
    console.log('Failed to populate dictionary');
    return;
  }

  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalEntries: result.dictionaryEntries.length,
      sourcePhrases: result.totalPhrases,
    },
    entries: result.dictionaryEntries.map(entry => ({
      word: entry.word,
      language: entry.language,
      pronunciation: entry.pronunciation,
      definitions: entry.definitions.map(d => ({
        type: d.partOfSpeech,
        meaning: d.meaning,
        example: d.example,
      })),
      difficulty: entry.difficulty,
      synonyms: entry.synonyms,
    })),
  };

  console.log('Dictionary exported:');
  console.log(JSON.stringify(exportData, null, 2));

  return exportData;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Dictionary Population Service - Examples Demo       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    await exampleBasicPopulation();
    console.log('\n' + '='.repeat(60) + '\n');

    await exampleDisplayDictionaryEntries();
    console.log('\n' + '='.repeat(60) + '\n');

    await exampleSearchDictionary();
    console.log('\n' + '='.repeat(60) + '\n');

    await exampleWithoutStopWords();
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}
