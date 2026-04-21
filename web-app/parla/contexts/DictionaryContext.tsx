"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DictionaryWord } from '@/lib/types/dictionary';
import { populateDictionaryFromPhrases, PopulationProgress } from '@/lib/services/dictionaryPopulation';

interface DictionaryContextType {
  words: DictionaryWord[];
  isLoading: boolean;
  isInitialized: boolean;
  isPopulating: boolean;
  populationProgress: PopulationProgress | null;
  loadDictionary: () => Promise<void>;
  populateFromPhrases: (userId: number) => Promise<void>;
  addWord: (word: DictionaryWord) => void;
  updateWord: (id: string, updates: Partial<DictionaryWord>) => void;
  deleteWord: (id: string) => void;
  clearDictionary: () => void;
}

const DictionaryContext = createContext<DictionaryContextType | undefined>(undefined);

const STORAGE_KEY = 'parla_dictionary';

export function DictionaryProvider({ children }: { children: React.ReactNode }) {
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [populationProgress, setPopulationProgress] = useState<PopulationProgress | null>(null);

  // Load dictionary from localStorage
  const loadDictionary = useCallback(async () => {
    if (isInitialized) return;

    setIsLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DictionaryWord[];
        // Convert date strings back to Date objects
        const wordsWithDates = parsed.map((word) => ({
          ...word,
          createdAt: new Date(word.createdAt),
          updatedAt: word.updatedAt ? new Date(word.updatedAt) : undefined,
        }));
        setWords(wordsWithDates);
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading dictionary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Save to localStorage whenever words change
  useEffect(() => {
    if (isInitialized && words.length >= 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    }
  }, [words, isInitialized]);

  // Add a new word
  const addWord = useCallback((word: DictionaryWord) => {
    setWords(prev => {
      // Check if word already exists
      const exists = prev.some(w => w.word.toLowerCase() === word.word.toLowerCase());
      if (exists) {
        console.warn('Word already exists in dictionary');
        return prev;
      }
      return [...prev, word];
    });
  }, []);

  // Update an existing word
  const updateWord = useCallback((id: string, updates: Partial<DictionaryWord>) => {
    setWords(prev =>
      prev.map(word =>
        word.id === id
          ? { ...word, ...updates, updatedAt: new Date() }
          : word
      )
    );
  }, []);

  // Delete a word
  const deleteWord = useCallback((id: string) => {
    setWords(prev => prev.filter(word => word.id !== id));
  }, []);

  // Clear all words
  const clearDictionary = useCallback(() => {
    setWords([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Populate dictionary from user's phrases
  const populateFromPhrases = useCallback(async (userId: number) => {
    setIsPopulating(true);
    setPopulationProgress(null);

    try {
      const result = await populateDictionaryFromPhrases(userId, {
        filterStopWords: true,
        maxDefinitionsPerWord: 3,
        targetLanguage: 'es',
        onProgress: (progress) => {
          setPopulationProgress(progress);
        },
      });

      if (result.success && result.dictionaryEntries.length > 0) {
        // Add new words to dictionary (avoid duplicates)
        setWords(prev => {
          const existingWords = new Set(prev.map(w => w.word.toLowerCase()));
          const newWords = result.dictionaryEntries.filter(
            entry => !existingWords.has(entry.word.toLowerCase())
          );
          return [...prev, ...newWords];
        });

        console.log(`✅ Dictionary populated: ${result.successfulDefinitions} words added`);
      } else {
        console.warn('No words were added to dictionary');
      }
    } catch (error) {
      console.error('Error populating dictionary:', error);
    } finally {
      setIsPopulating(false);
      setPopulationProgress(null);
    }
  }, []);

  const value: DictionaryContextType = {
    words,
    isLoading,
    isInitialized,
    isPopulating,
    populationProgress,
    loadDictionary,
    populateFromPhrases,
    addWord,
    updateWord,
    deleteWord,
    clearDictionary,
  };

  return (
    <DictionaryContext.Provider value={value}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const context = useContext(DictionaryContext);
  if (context === undefined) {
    throw new Error('useDictionary must be used within a DictionaryProvider');
  }
  return context;
}
