// Test script to verify APIs are working correctly
// Run this in browser console or Node.js

const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';
const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries';
const MYMEMORY_EMAIL = 'parla@example.com';

// Test 1: MyMemory Translation API
export async function testMyMemoryAPI() {
  console.log('🔍 Testing MyMemory Translation API...');
  
  const word = 'hello';
  const langPair = 'en|es';
  const url = `${MYMEMORY_API_URL}?q=${encodeURIComponent(word)}&langpair=${langPair}&de=${encodeURIComponent(MYMEMORY_EMAIL)}`;
  
  console.log('URL:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('✅ MyMemory Response:', {
      translatedText: data.responseData.translatedText,
      match: data.responseData.match,
      quotaFinished: data.quotaFinished,
      responseStatus: data.responseStatus,
      matches: data.matches?.length || 0
    });
    
    return data;
  } catch (error) {
    console.error('❌ MyMemory Error:', error);
    throw error;
  }
}

// Test 2: Free Dictionary API
export async function testFreeDictionaryAPI() {
  console.log('🔍 Testing Free Dictionary API...');
  
  const word = 'hello';
  const language = 'en';
  const url = `${DICTIONARY_API_URL}/${language}/${encodeURIComponent(word.toLowerCase())}`;
  
  console.log('URL:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('✅ Free Dictionary Response:', {
      word: data[0].word,
      phonetic: data[0].phonetic,
      phonetics: data[0].phonetics.length,
      meanings: data[0].meanings.length,
      audioUrl: data[0].phonetics.find((p: any) => p.audio)?.audio
    });
    
    // Show first meaning
    if (data[0].meanings[0]) {
      console.log('First meaning:', {
        partOfSpeech: data[0].meanings[0].partOfSpeech,
        definitions: data[0].meanings[0].definitions.length,
        firstDefinition: data[0].meanings[0].definitions[0].definition
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Free Dictionary Error:', error);
    throw error;
  }
}

// Test 3: Combined lookup (like lookupWord function)
export async function testCombinedLookup() {
  console.log('🔍 Testing Combined Lookup...');
  
  const word = 'hello';
  const sourceLang = 'en';
  const targetLang = 'es';
  
  try {
    const [translationResult, definitionResult] = await Promise.all([
      testMyMemoryAPI(),
      testFreeDictionaryAPI()
    ]);
    
    console.log('✅ Combined Result:', {
      word,
      translation: translationResult.responseData.translatedText,
      pronunciation: definitionResult[0].phonetic,
      audioUrl: definitionResult[0].phonetics.find((p: any) => p.audio)?.audio,
      definitionsCount: definitionResult[0].meanings.reduce(
        (acc: number, m: any) => acc + m.definitions.length, 
        0
      )
    });
    
    return { translationResult, definitionResult };
  } catch (error) {
    console.error('❌ Combined Lookup Error:', error);
    throw error;
  }
}

// Run all tests
export async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  
  try {
    await testMyMemoryAPI();
    console.log('\n');
    
    await testFreeDictionaryAPI();
    console.log('\n');
    
    await testCombinedLookup();
    console.log('\n');
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Tests failed:', error);
  }
}

// Example usage in browser console:
// import { runAllTests } from './testApis';
// runAllTests();
