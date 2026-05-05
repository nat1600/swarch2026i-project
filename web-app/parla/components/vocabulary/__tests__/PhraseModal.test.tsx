import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhraseModal from '../PhraseModal';
import { Phrase } from '@/lib/types/phrases';

const mockPhrase: Phrase = {
  id: 1,
  user_id: 1,
  source_language_id: 1,
  target_language_id: 2,
  original_text: 'Hello',
  translated_text: 'Hola',
  pronunciation: '/həˈloʊ/',
  last_reviewed_date: new Date('2024-01-01').toISOString(),
  next_review_date: null,
  created_at: new Date('2024-01-01').toISOString(),
  active: true,
  source_language: { id: 1, name: 'English' },
  target_language: { id: 2, name: 'Spanish' }
};

describe('PhraseModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  describe('Modal visibility', () => {
    it('does not render when isOpen is false', () => {
      render(
        <PhraseModal
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      expect(screen.queryByText('Nueva Frase')).not.toBeInTheDocument();
      expect(screen.queryByText('Editar Frase')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      expect(screen.getByText('Nueva Frase')).toBeInTheDocument();
    });
  });

  describe('Create mode', () => {
    it('renders create mode when no phrase is provided', () => {
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      expect(screen.getByText('Nueva Frase')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    });

    it('renders empty form fields in create mode', () => {
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      const originalInput = screen.getByPlaceholderText(/Ej: Hello/i) as HTMLInputElement;
      const translatedInput = screen.getByPlaceholderText(/Ej: Hola/i) as HTMLInputElement;
      const pronunciationInput = screen.getByPlaceholderText(/\/həˈloʊ\//i) as HTMLInputElement;
      
      expect(originalInput.value).toBe('');
      expect(translatedInput.value).toBe('');
      expect(pronunciationInput.value).toBe('');
    });

    it('submits new phrase with correct data', async () => {
      const user = userEvent.setup();
      
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      await user.type(screen.getByPlaceholderText(/Ej: Hello/i), 'Good morning');
      await user.type(screen.getByPlaceholderText(/Ej: Hola/i), 'Buenos días');
      await user.type(screen.getByPlaceholderText(/\/həˈloʊ\//i), '/ɡʊd ˈmɔːrnɪŋ/');
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          user_id: 1,
          source_language_id: 1,
          target_language_id: 2,
          original_text: 'Good morning',
          translated_text: 'Buenos días',
          pronunciation: '/ɡʊd ˈmɔːrnɪŋ/',
        });
      });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('submits phrase with null pronunciation when empty', async () => {
      const user = userEvent.setup();
      
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      await user.type(screen.getByPlaceholderText(/Ej: Hello/i), 'Test');
      await user.type(screen.getByPlaceholderText(/Ej: Hola/i), 'Prueba');
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          user_id: 1,
          source_language_id: 1,
          target_language_id: 2,
          original_text: 'Test',
          translated_text: 'Prueba',
          pronunciation: null,
        });
      });
    });
  });

  describe('Edit mode', () => {
    it('renders edit mode with phrase data', () => {
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          phrase={mockPhrase}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      expect(screen.getByText('Editar Frase')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hola')).toBeInTheDocument();
      expect(screen.getByDisplayValue('/həˈloʊ/')).toBeInTheDocument();
    });

    it('populates form with phrase data when phrase is provided', () => {
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          phrase={mockPhrase}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      const originalInput = screen.getByDisplayValue('Hello') as HTMLInputElement;
      const translatedInput = screen.getByDisplayValue('Hola') as HTMLInputElement;
      const pronunciationInput = screen.getByDisplayValue('/həˈloʊ/') as HTMLInputElement;
      
      expect(originalInput).toBeInTheDocument();
      expect(translatedInput).toBeInTheDocument();
      expect(pronunciationInput).toBeInTheDocument();
    });

    it('handles phrase with null pronunciation', () => {
      const phraseWithoutPronunciation = { ...mockPhrase, pronunciation: null };
      
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          phrase={phraseWithoutPronunciation}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      const pronunciationInput = screen.getByPlaceholderText(/\/həˈloʊ\//i) as HTMLInputElement;
      expect(pronunciationInput.value).toBe('');
    });

    it('submits updated phrase with correct data', async () => {
      const user = userEvent.setup();
      
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          phrase={mockPhrase}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      const originalInput = screen.getByDisplayValue('Hello');
      await user.clear(originalInput);
      await user.type(originalInput, 'Hi there');
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          original_text: 'Hi there',
          translated_text: 'Hola',
          pronunciation: '/həˈloʊ/',
        });
      });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form when phrase changes', () => {
      const { rerender } = render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          phrase={mockPhrase}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
      
      const newPhrase = { ...mockPhrase, id: 2, original_text: 'Goodbye', translated_text: 'Adiós' };
      
      rerender(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          phrase={newPhrase}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      expect(screen.getByDisplayValue('Goodbye')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Adiós')).toBeInTheDocument();
    });

    it('resets form when modal reopens', () => {
      const { rerender } = render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          phrase={mockPhrase}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
      
      rerender(
        <PhraseModal
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          phrase={mockPhrase}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      rerender(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          phrase={null}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      const originalInput = screen.getByPlaceholderText(/Ej: Hello/i) as HTMLInputElement;
      expect(originalInput.value).toBe('');
    });
  });

  describe('User interactions', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      const closeButton = screen.getByLabelText('Cerrar');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('allows typing in all input fields', async () => {
      const user = userEvent.setup();
      
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      const originalInput = screen.getByPlaceholderText(/Ej: Hello/i);
      const translatedInput = screen.getByPlaceholderText(/Ej: Hola/i);
      const pronunciationInput = screen.getByPlaceholderText(/\/həˈloʊ\//i);
      
      await user.type(originalInput, 'Test');
      await user.type(translatedInput, 'Prueba');
      await user.type(pronunciationInput, '/test/');
      
      expect(originalInput).toHaveValue('Test');
      expect(translatedInput).toHaveValue('Prueba');
      expect(pronunciationInput).toHaveValue('/test/');
    });
  });

  describe('Submit behavior', () => {
    it('disables submit button while submitting', async () => {
      const user = userEvent.setup();
      mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      await user.type(screen.getByPlaceholderText(/Ej: Hello/i), 'Test');
      await user.type(screen.getByPlaceholderText(/Ej: Hola/i), 'Prueba');
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);
      
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Guardando...')).toBeInTheDocument();
    });

    it('shows "Guardar" text when not submitting', () => {
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      expect(screen.getByText('Guardar')).toBeInTheDocument();
    });

    it('handles save errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockOnSave.mockRejectedValue(new Error('Save failed'));
      
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      await user.type(screen.getByPlaceholderText(/Ej: Hello/i), 'Test');
      await user.type(screen.getByPlaceholderText(/Ej: Hola/i), 'Prueba');
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error saving phrase:', expect.any(Error));
      });
      
      expect(mockOnClose).not.toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    it('re-enables submit button after error', async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockOnSave.mockRejectedValue(new Error('Save failed'));
      
      render(
        <PhraseModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          userId={1}
          sourceLanguageId={1}
          targetLanguageId={2}
        />
      );
      
      await user.type(screen.getByPlaceholderText(/Ej: Hello/i), 'Test');
      await user.type(screen.getByPlaceholderText(/Ej: Hola/i), 'Prueba');
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      
      consoleError.mockRestore();
    });
  });
});
