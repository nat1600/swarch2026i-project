import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PracticePage from '../page';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useParlaUser } from '@/hooks/useParlaUser';
import { useRouter } from 'next/navigation';
import { phrasesService } from '@/lib/services/phrasesService';
import { Phrase, ReviewQuality } from '@/lib/types/phrases';

jest.mock('@auth0/nextjs-auth0/client');
jest.mock('@/hooks/useParlaUser');
jest.mock('next/navigation');
jest.mock('@/lib/services/phrasesService');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));
jest.mock('canvas-confetti', () => jest.fn());

const mockDuePhrases: Phrase[] = [
  {
    id: 1,
    user_id: 1,
    original_text: 'Hello',
    translated_text: 'Hola',
    pronunciation: null,
    last_reviewed_date: null,
    next_review_date: new Date().toISOString(),
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
    pronunciation: null,
    last_reviewed_date: null,
    next_review_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    active: true,
    source_language: { id: 1, name: 'English' },
    target_language: { id: 2, name: 'Spanish' }
  },
];

const mockUser = {
  sub: 'auth0|123',
  given_name: 'John',
  name: 'John Doe',
  picture: 'https://example.com/pic.jpg',
};

describe('PracticePage Integration Tests', () => {
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
      isLoading: false,
    });
    
    (phrasesService.getDuePhrases as jest.Mock).mockResolvedValue(mockDuePhrases);
    (phrasesService.reviewPhrase as jest.Mock).mockResolvedValue({
      inner_repetition_interval: 3,
    });
  });

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', () => {
      (useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(<PracticePage />);

      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('shows loading state while checking authentication', () => {
      (useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(<PracticePage />);

      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Phrase Loading', () => {
    it('loads due phrases on mount', async () => {
      render(<PracticePage />);

      await waitFor(() => {
        expect(phrasesService.getDuePhrases).toHaveBeenCalledWith(1);
      });
    });

    it('displays first phrase', async () => {
      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });
    });

    it('shows empty state when no phrases are due', async () => {
      (phrasesService.getDuePhrases as jest.Mock).mockResolvedValue([]);

      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('¡Todo al día!')).toBeInTheDocument();
        expect(screen.getByText('No tienes frases pendientes de repaso')).toBeInTheDocument();
      });
    });
  });

  describe('Flashcard Interaction', () => {
    it('flips card when clicked', async () => {
      const user = userEvent.setup();
      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const card = screen.getByText('Hello').closest('div[style*="transform"]');
      if (card) {
        await user.click(card);
      }

      await waitFor(() => {
        expect(screen.getByText('Hola')).toBeInTheDocument();
      });
    });

    it('shows rating options after flipping', async () => {
      const user = userEvent.setup();
      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const card = screen.getByText('Hello').closest('div[style*="transform"]');
      if (card) {
        await user.click(card);
      }

      await waitFor(() => {
        expect(screen.getByText('¿Qué tan bien lo recordaste?')).toBeInTheDocument();
      });
    });
  });

  describe('Review Submission', () => {
    it('submits review with quality rating', async () => {
      const user = userEvent.setup();
      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const card = screen.getByText('Hello').closest('div[style*="transform"]');
      if (card) {
        await user.click(card);
      }

      await waitFor(() => {
        expect(screen.getByText('¡Perfecto!')).toBeInTheDocument();
      });

      const perfectButton = screen.getByText('¡Perfecto!');
      await user.click(perfectButton);

      await waitFor(() => {
        expect(phrasesService.reviewPhrase).toHaveBeenCalledWith(1, ReviewQuality.PERFECT);
      });
    });

    it('moves to next phrase after review', async () => {
      const user = userEvent.setup();
      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const card = screen.getByText('Hello').closest('div[style*="transform"]');
      if (card) {
        await user.click(card);
      }

      await waitFor(() => {
        expect(screen.getByText('¡Perfecto!')).toBeInTheDocument();
      });

      const perfectButton = screen.getByText('¡Perfecto!');
      await user.click(perfectButton);

      await waitFor(() => {
        expect(screen.getByText('Goodbye')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('completes session after last phrase', async () => {
      const user = userEvent.setup();
      (phrasesService.getDuePhrases as jest.Mock).mockResolvedValue([mockDuePhrases[0]]);

      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const card = screen.getByText('Hello').closest('div[style*="transform"]');
      if (card) {
        await user.click(card);
      }

      await waitFor(() => {
        expect(screen.getByText('¡Perfecto!')).toBeInTheDocument();
      });

      const perfectButton = screen.getByText('¡Perfecto!');
      await user.click(perfectButton);

      await waitFor(() => {
        expect(screen.getByText('¡Sesión Completada!')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles review error gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (phrasesService.reviewPhrase as jest.Mock).mockRejectedValue(new Error('Review failed'));

      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const card = screen.getByText('Hello').closest('div[style*="transform"]');
      if (card) {
        await user.click(card);
      }

      await waitFor(() => {
        expect(screen.getByText('¡Perfecto!')).toBeInTheDocument();
      });

      const perfectButton = screen.getByText('¡Perfecto!');
      await user.click(perfectButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Progress Tracking', () => {
    it('displays progress bar', async () => {
      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('Frase 1 de 2')).toBeInTheDocument();
      });
    });

    it('updates progress after reviewing phrase', async () => {
      const user = userEvent.setup();
      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('Frase 1 de 2')).toBeInTheDocument();
      });

      const card = screen.getByText('Hello').closest('div[style*="transform"]');
      if (card) {
        await user.click(card);
      }

      await waitFor(() => {
        expect(screen.getByText('¡Perfecto!')).toBeInTheDocument();
      });

      const perfectButton = screen.getByText('¡Perfecto!');
      await user.click(perfectButton);

      await waitFor(() => {
        expect(screen.getByText('Frase 2 de 2')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Navigation', () => {
    it('navigates back to vocabulary page', async () => {
      const user = userEvent.setup();
      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /volver/i });
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/vocabulary');
    });

    it('navigates to vocabulary from empty state', async () => {
      const user = userEvent.setup();
      (phrasesService.getDuePhrases as jest.Mock).mockResolvedValue([]);

      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('¡Todo al día!')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /volver a mi bóveda/i });
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/vocabulary');
    });
  });

  describe('Session Restart', () => {
    it('restarts session after completion', async () => {
      const user = userEvent.setup();
      (phrasesService.getDuePhrases as jest.Mock).mockResolvedValue([mockDuePhrases[0]]);

      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      const card = screen.getByText('Hello').closest('div[style*="transform"]');
      if (card) {
        await user.click(card);
      }

      await waitFor(() => {
        expect(screen.getByText('¡Perfecto!')).toBeInTheDocument();
      });

      const perfectButton = screen.getByText('¡Perfecto!');
      await user.click(perfectButton);

      await waitFor(() => {
        expect(screen.getByText('¡Sesión Completada!')).toBeInTheDocument();
      }, { timeout: 2000 });

      (phrasesService.getDuePhrases as jest.Mock).mockResolvedValue(mockDuePhrases);

      const restartButton = screen.getByRole('button', { name: /nueva sesión/i });
      await user.click(restartButton);

      await waitFor(() => {
        expect(phrasesService.getDuePhrases).toHaveBeenCalledTimes(2);
      });
    });
  });
});
