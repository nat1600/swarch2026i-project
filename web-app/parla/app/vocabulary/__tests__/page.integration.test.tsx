import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VocabularioPage from '../page';
import { phrasesService } from '@/lib/services/phrasesService';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useParlaUser } from '@/hooks/useParlaUser';
import { useRouter } from 'next/navigation';
import { Phrase } from '@/lib/types/phrases';

jest.mock('@auth0/nextjs-auth0/client');
jest.mock('@/hooks/useParlaUser');
jest.mock('@/lib/services/phrasesService');
jest.mock('next/navigation');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockPhrases: Phrase[] = [
  {
    id: 1,
    user_id: 1,
    original_text: 'Hello',
    translated_text: 'Hola',
    pronunciation: null,
    last_reviewed_date: new Date().toISOString(),
    next_review_date: null,
    created_at: new Date().toISOString(),
    active: true,
    source_language: { id: 1, name: 'English' },
    target_language: { id: 2, name: 'Spanish' }
  },
  {
    id: 2,
    user_id: 1,
    original_text: 'Goodbye',
    translated_text: 'Adiós',
    pronunciation: '/ɡʊdˈbaɪ/',
    last_reviewed_date: null,
    next_review_date: null,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    source_language: { id: 1, name: 'English' },
    target_language: { id: 2, name: 'Spanish' }
  },
  {
    id: 3,
    user_id: 1,
    original_text: 'Thank you',
    translated_text: 'Gracias',
    pronunciation: null,
    last_reviewed_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    next_review_date: null,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
    source_language: { id: 1, name: 'English' },
    target_language: { id: 2, name: 'Spanish' }
  },
];

const mockUser = {
  sub: 'auth0|123',
  given_name: 'John',
  picture: 'https://example.com/pic.jpg',
};

describe('VocabularioPage Integration Tests', () => {
  const mockPush = jest.fn();

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
      nativeLanguageId: 1,
      learningLanguageId: 2,
      learningLanguageCode: 'es',
      isLoading: false,
    });
    
    (phrasesService.getAllPhrases as jest.Mock).mockResolvedValue(mockPhrases);
    (phrasesService.createPhrase as jest.Mock).mockResolvedValue(mockPhrases[0]);
    (phrasesService.updatePhrase as jest.Mock).mockResolvedValue(mockPhrases[0]);
    (phrasesService.deletePhrase as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', () => {
      (useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(<VocabularioPage />);

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('shows loading state while checking authentication', () => {
      (useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(<VocabularioPage />);

      expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });

    it('renders page when user is authenticated', async () => {
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('🧳 Mi Bóveda')).toBeInTheDocument();
      });
    });
  });

  describe('Phrase Loading', () => {
    it('loads and displays phrases on mount', async () => {
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(phrasesService.getAllPhrases).toHaveBeenCalled();
      });

      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Goodbye')).toBeInTheDocument();
      expect(screen.getByText('Thank you')).toBeInTheDocument();
    });

    it('shows loading state while fetching phrases', () => {
      render(<VocabularioPage />);

      expect(screen.getByText('Cargando frases...')).toBeInTheDocument();
    });

    it('filters out inactive phrases', async () => {
      const phrasesWithInactive = [
        ...mockPhrases,
        {
          id: 4,
          user_id: 1,
          original_text: 'Inactive',
          translated_text: 'Inactivo',
          pronunciation: null,
          last_reviewed_date: null,
          next_review_date: null,
          created_at: new Date().toISOString(),
          active: false,
          source_language: { id: 1, name: 'English' },
          target_language: { id: 2, name: 'Spanish' }
        },
      ];

      (phrasesService.getAllPhrases as jest.Mock).mockResolvedValue(phrasesWithInactive);

      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
      });
    });

    it('handles error when loading phrases', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (phrasesService.getAllPhrases as jest.Mock).mockRejectedValue(new Error('Failed to load'));

      render(<VocabularioPage />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Statistics Display', () => {
    it('displays correct total phrase count', async () => {
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Tienes 3 frases en tu inventario.')).toBeInTheDocument();
      });
    });

    it('displays correct mastered count', async () => {
      render(<VocabularioPage />);

      await waitFor(() => {
        const stats = screen.getAllByText('1');
        expect(stats.length).toBeGreaterThan(0);
      });
    });

    it('displays correct needs review count', async () => {
      render(<VocabularioPage />);

      await waitFor(() => {
        const stats = screen.getAllByText('2');
        expect(stats.length).toBeGreaterThan(0);
      });
    });

    it('updates statistics after creating a phrase', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Tienes 3 frases en tu inventario.')).toBeInTheDocument();
      });

      const newPhraseButton = screen.getByRole('button', { name: /nueva frase/i });
      await user.click(newPhraseButton);

      const newPhrase = {
        id: 4,
        user_id: 1,
        original_text: 'New',
        translated_text: 'Nuevo',
        pronunciation: null,
        last_reviewed_date: null,
        next_review_date: null,
        created_at: new Date().toISOString(),
        active: true,
        source_language: { id: 1, name: 'English' },
        target_language: { id: 2, name: 'Spanish' }
      };

      (phrasesService.getAllPhrases as jest.Mock).mockResolvedValue([...mockPhrases, newPhrase]);

      await user.type(screen.getByPlaceholderText(/Ej: Hello/i), 'New');
      await user.type(screen.getByPlaceholderText(/Ej: Hola/i), 'Nuevo');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => {
        expect(screen.getByText('Tienes 4 frases en tu inventario.')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters phrases by original text', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar en tu inventario...');
      await user.type(searchInput, 'Hello');

      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.queryByText('Goodbye')).not.toBeInTheDocument();
    });

    it('filters phrases by translated text', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Goodbye')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar en tu inventario...');
      await user.type(searchInput, 'Adiós');

      expect(screen.getByText('Goodbye')).toBeInTheDocument();
      expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    });

    it('search is case insensitive', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar en tu inventario...');
      await user.type(searchInput, 'hello');

      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar en tu inventario...');
      await user.type(searchInput, 'xyz123');

      expect(screen.getByText('No se encontraron frases')).toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
    it('shows all phrases by default', async () => {
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Goodbye')).toBeInTheDocument();
        expect(screen.getByText('Thank you')).toBeInTheDocument();
      });
    });

    it('filters to show only recent phrases', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const recentButton = screen.getByRole('button', { name: 'Recientes' });
      await user.click(recentButton);

      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('filters to show phrases that need review', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Goodbye')).toBeInTheDocument();
      });

      const needReviewButton = screen.getByRole('button', { name: 'Necesitan Repaso' });
      await user.click(needReviewButton);

      expect(screen.getByText('Goodbye')).toBeInTheDocument();
      expect(screen.getByText('Thank you')).toBeInTheDocument();
    });

    it('filters to show mastered phrases', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const masteredButton = screen.getByRole('button', { name: 'Dominadas' });
      await user.click(masteredButton);

      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.queryByText('Goodbye')).not.toBeInTheDocument();
    });

    it('highlights active filter', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const recentButton = screen.getByRole('button', { name: 'Recientes' });
      await user.click(recentButton);

      expect(recentButton).toHaveClass('bg-parla-blue');
    });
  });

  describe('Create Phrase Flow', () => {
    it('opens modal when clicking Nueva Frase button', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const newPhraseButton = screen.getByRole('button', { name: /nueva frase/i });
      await user.click(newPhraseButton);

      expect(screen.getByText('Nueva Frase')).toBeInTheDocument();
    });

    it('creates new phrase successfully', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const newPhraseButton = screen.getByRole('button', { name: /nueva frase/i });
      await user.click(newPhraseButton);

      await user.type(screen.getByPlaceholderText(/Ej: Hello/i), 'Good morning');
      await user.type(screen.getByPlaceholderText(/Ej: Hola/i), 'Buenos días');

      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => {
        expect(phrasesService.createPhrase).toHaveBeenCalledWith({
          user_id: 1,
          source_language_id: 1,
          target_language_id: 2,
          original_text: 'Good morning',
          translated_text: 'Buenos días',
          pronunciation: null,
        });
      });
    });

    it('refreshes phrase list after creating', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const newPhraseButton = screen.getByRole('button', { name: /nueva frase/i });
      await user.click(newPhraseButton);

      await user.type(screen.getByPlaceholderText(/Ej: Hello/i), 'Test');
      await user.type(screen.getByPlaceholderText(/Ej: Hola/i), 'Prueba');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => {
        expect(phrasesService.getAllPhrases).toHaveBeenCalledTimes(2);
      });
    });

    it('handles create error gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (phrasesService.createPhrase as jest.Mock).mockRejectedValue(new Error('Create failed'));

      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const newPhraseButton = screen.getByRole('button', { name: /nueva frase/i });
      await user.click(newPhraseButton);

      await user.type(screen.getByPlaceholderText(/Ej: Hello/i), 'Test');
      await user.type(screen.getByPlaceholderText(/Ej: Hola/i), 'Prueba');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Edit Phrase Flow', () => {
    it('opens modal with phrase data when clicking edit', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText('Editar frase');
      await user.click(editButtons[0]);

      expect(screen.getByText('Editar Frase')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    });

    it('updates phrase successfully', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText('Editar frase');
      await user.click(editButtons[0]);

      const originalInput = screen.getByDisplayValue('Hello');
      await user.clear(originalInput);
      await user.type(originalInput, 'Hi');

      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => {
        expect(phrasesService.updatePhrase).toHaveBeenCalled();
      });
    });

    it('refreshes phrase list after updating', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText('Editar frase');
      await user.click(editButtons[0]);

      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => {
        expect(phrasesService.getAllPhrases).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Delete Phrase Flow', () => {
    it('shows confirmation dialog when clicking delete', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Eliminar frase');
      await user.click(deleteButtons[0]);

      expect(screen.getByText('¿Eliminar frase?')).toBeInTheDocument();
    });

    it('cancels delete when clicking cancel', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Eliminar frase');
      await user.click(deleteButtons[0]);

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(screen.queryByText('¿Eliminar frase?')).not.toBeInTheDocument();
      expect(phrasesService.deletePhrase).not.toHaveBeenCalled();
    });

    it('deletes phrase when confirming', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Eliminar frase');
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(phrasesService.deletePhrase).toHaveBeenCalledWith(1);
      });
    });

    it('refreshes phrase list after deleting', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Eliminar frase');
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(phrasesService.getAllPhrases).toHaveBeenCalledTimes(2);
      });
    });

    it('handles delete error gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (phrasesService.deletePhrase as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Eliminar frase');
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('navigates to practice page when clicking Entrenar button', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const trainButton = screen.getByRole('button', { name: /entrenar/i });
      await user.click(trainButton);

      expect(mockPush).toHaveBeenCalledWith('/vocabulary/practice');
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no phrases exist', async () => {
      (phrasesService.getAllPhrases as jest.Mock).mockResolvedValue([]);

      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('¡Aún no tienes frases!')).toBeInTheDocument();
      });
    });

    it('shows add phrase button in empty state', async () => {
      (phrasesService.getAllPhrases as jest.Mock).mockResolvedValue([]);

      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /agregar frase/i })).toBeInTheDocument();
      });
    });

    it('shows empty state when search has no results', async () => {
      const user = userEvent.setup();
      render(<VocabularioPage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar en tu inventario...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No se encontraron frases')).toBeInTheDocument();
      expect(screen.getByText('Intenta con otro filtro o búsqueda')).toBeInTheDocument();
    });
  });
});
