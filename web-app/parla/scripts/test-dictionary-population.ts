/**
 * Test Script for Dictionary Population
 * Run with: npx tsx scripts/test-dictionary-population.ts
 */

import { 
  exampleBasicPopulation,
  exampleDisplayDictionaryEntries,
  exampleSearchDictionary,
  exampleWithoutStopWords,
  runAllExamples
} from '../lib/services/dictionaryPopulation.examples';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  console.log('🚀 Dictionary Population Test Script\n');

  try {
    switch (command) {
      case 'basic':
        await exampleBasicPopulation();
        break;
      
      case 'display':
        await exampleDisplayDictionaryEntries();
        break;
      
      case 'search':
        await exampleSearchDictionary();
        break;
      
      case 'stopwords':
        await exampleWithoutStopWords();
        break;
      
      case 'all':
      default:
        await runAllExamples();
        break;
    }

    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
