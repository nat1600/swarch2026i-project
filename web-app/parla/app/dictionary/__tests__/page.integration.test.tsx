import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DictionaryPage from '../page';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useParlaUser } from '@/hooks/useParlaUser';
import { useRouter } from 'next/navigation';
import { useDictionary } from '@/contexts/DictionaryContext';

jest.mock('@auth0/nextjs-auth0/client');
jest.mock('@/hooks/useParlaUser');
jest.mock('next/navigation');
jest.mock('@/contexts/DictionaryContext');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockWords = [
  {
    id: 'word1',
    word: 'Hello',
    translation: 'Hola',
    pronunciation: '/həˈloʊ/',
    definitions: [{ id: 'd1', meaning: 'Saludo', partOfSpeech: 'noun' }],
    examples: [{ id: 'e1', sentence: 'Hello world', translation: 'Hola mundo' }],
    synonyms: [],
    antonyms: [],
    language: 'en',
    targetLanguage: 'es',
    difficulty: 'beginner',
    wordType: 'noun',
    isFavorite: false,
    isLearned: true,
    reviewCount: 5,
    createdAt: new Date(),
  },
  {
    id: 'word2',
    word: 'Goodbye',
    translation: 'Adiós',
    pronunciation: '/ɡʊdˈbaɪ/',
    definitions: [{ id: 'd2', meaning: 'Despedida', partOfSpeech: 'noun' }],
    examples: [],
    synonyms: [],
    antonyms: [],
    language: 'en',
    targetLanguage: 'es',
    difficulty: 'intermediate',
    wordType: 'noun',
    isFavorite: true,
    isLearned: false,
    reviewCount: 2,
    createdAt: new Date(),
  },
];

const mockUser = {
  sub: 'auth0|123',
  given_name: 'John',
  picture: 'https://example.com/pic.jpg',
};

describe('DictionaryPage Integration Tests', () => {
  const mockPush = jest.fn();
  const mockLoadDictionary = jest.fn();
  const mockPopulateFromPhrases = jest.fn();
  const mockAddWord = jest.fn();
  const mockUpdateWord = jest.fn();
  const mockDeleteWord = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
    });
    
    (useParlaUser as jest.Mock).mockReturnValue({
      numericId: 1,
      learningLanguageCode: 'es',
      isLoading: false,
    });
    
    (useDictionary as jest.Mock).mockReturnValue({
      words: mockWords,
      isLoading: false,
      isInitialized: true,
      isPopulating: false,
      populationProgress: null,
      loadDictionary: mockLoadDictionary,
      populateFromPhrases: mockPopulateFromPhrases,
      addWord: mockAddWord,
      updateWord: mockUpdateWord,
      deleteWord: mockDeleteWord,
    });
  });

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', () => {
      (useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(<DictionaryPage />);

      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('shows loading state while checking authentication', () => {
      (useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(<DictionaryPage />);

      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Dictionary Loading', () => {
    it('loads dictionary on mount', () => {
      (useDictionary as jest.Mock).mockReturnValue({
        words: [],
        isLoading: false,
        isInitialized: false,
        isPopulating: false,
        populationProgress: null,
        loadDictionary: mockLoadDictionary,
        populateFromPhrases: mockPopulateFromPhrases,
        addWord: mockAddWord,
        updateWord: mockUpdateWord,
        deleteWord: mockDeleteWord,
      });

      render(<DictionaryPage />);

      expect(mockLoadDictionary).toHaveBeenCalled();
    });

    it('displays words when loaded', async () => {
      render(<DictionaryPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Goodbye')).toBeInTheDocument();
      });
    });

    it('shows loading state while populating', () => {
      (useDictionary as jest.Mock).mockReturnValue({
        words: [],
        isLoading: false,
        isInitialized: true,
        isPopulating: true,
        populationProgress: {
          message: 'Procesando frases...',
          currentWord: 'test',
          currentStep: 5,
          totalSteps: 10,
        },
        loadDictionary: mockLoadDictionary,
        populateFromPhrases: mockPopulateFromPhrases,
        addWord: mockAddWord,
        updateWord: mockUpdateWord,
        deleteWord: mockDeleteWord,
      });

      render(<DictionaryPage />);

      expect(screen.getByText('Poblando diccionario desde tus frases...')).toBeInTheDocument();
      expect(screen.getByText('Procesando frases...')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters words by search query', async () => {
      const user = userEvent.setup();
      render(<DictionaryPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeTruthy();
      });

      const searchInput = screen.getByPlaceholderText('Buscar palabras, definiciones, sinónimos...');
      await user.type(searchInput, 'Hello');

      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('shows empty state when no results found', async () => {
      const user = userEvent.setup();
      render(<DictionaryPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar palabras, definiciones, sinónimos...');
      await user.type(searchInput, 'xyz123nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No se encontraron palabras')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Functionality', () => {
    it('changes sort order', async () => {
      const user = userEvent.setup();
      render(<DictionaryPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const sortSelect = screen.getByRole('combobox');
      await user.selectOptions(sortSelect, 'recent');

      expect(sortSelect).toHaveValue('recent');
    });

    it('toggles filters panel', async () => {
      const user = userEvent.setup();
      render(<DictionaryPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const filtersButton = screen.getByRole('button', { name: /filtros/i });
      await user.click(filtersButton);

      await waitFor(() => {
        expect(screen.getByText(/resultados/i)).toBeInTheDocument();
      });
    });
  });

  describe('Word Actions', () => {
    it('opens add word dialog', async () => {
      const user = userEvent.setup();
      render(<DictionaryPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /agregar palabra/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Nueva Palabra')).toBeInTheDocument();
      });
    });

    it('refreshes dictionary from phrases', async () => {
      const user = userEvent.setup();
      render(<DictionaryPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTitle('Actualizar desde frases');
      await user.click(refreshButton);

      expect(mockPopulateFromPhrases).toHaveBeenCalledWith(1, 'es');
    });

    it('toggles word favorite status', async () => {
      render(<DictionaryPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const favoriteButtons = screen.getAllByLabelText(/favorito/i);
      fireEvent.click(favoriteButtons[0]);

      expect(mockUpdateWord).toHaveBeenCalledWith('word1', { isFavorite: true });
    });

    it('toggles word learned status', async () => {
      render(<DictionaryPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const learnedButtons = screen.getAllByLabelText(/aprendida/i);
      fireEvent.click(learnedButtons[0]);

      expect(mockUpdateWord).toHaveBeenCalledWith('word1', { isLearned: false });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no words exist', async () => {
      (useDictionary as jest.Mock).mockReturnValue({
        words: [],
        isLoading: false,
        isInitialized: true,
        isPopulating: false,
        populationProgress: null,
        loadDictionary: mockLoadDictionary,
        populateFromPhrases: mockPopulateFromPhrases,
        addWord: mockAddWord,
        updateWord: mockUpdateWord,
        deleteWord: mockDeleteWord,
      });

      render(<DictionaryPage />);

      await waitFor(() => {
        expect(screen.getByText('Tu diccionario está vacío')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Display', () => {
    it('displays correct word count', async () => {
      render(<DictionaryPage />);

      await waitFor(() => {
        expect(screen.getByText('2 palabras en tu colección')).toBeInTheDocument();
      });
    });
  });
});
