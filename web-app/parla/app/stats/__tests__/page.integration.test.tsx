import { render, screen, waitFor } from '@testing-library/react';
import StatsPage from '../page';
import { useUser } from '@auth0/nextjs-auth0/client';
import {
  getUserStreak,
  getAllUserGameSessions,
} from '@/lib/api/gamificationService';

jest.mock('@auth0/nextjs-auth0/client');
jest.mock('@/lib/api/gamificationService');
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

const mockUser = {
  sub: 'auth0|123',
  given_name: 'John',
  name: 'John Doe',
};

const mockStreak = {
  currentStreak: 5,
  longestStreak: 10,
};

const mockSessions = [
  {
    id: '1',
    userId: 'auth0|123',
    gameType: 'fill-in-the-blank',
    score: 100,
    xpEarned: 50,
    durationSeconds: 300,
    completedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'auth0|123',
    gameType: 'word-match',
    score: 80,
    xpEarned: 40,
    durationSeconds: 240,
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

describe('StatsPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
    });
    
    (getUserStreak as jest.Mock).mockResolvedValue(mockStreak);
    (getAllUserGameSessions as jest.Mock).mockResolvedValue(mockSessions);
  });

  describe('Page Rendering', () => {
    it('renders stats page with title', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText('Mi Progreso')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching data', () => {
      (useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        isLoading: true,
      });

      render(<StatsPage />);

      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    });

    it('displays back button', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /volver/i });
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute('href', '/home');
      });
    });
  });

  describe('Streak Display', () => {
    it('displays current streak', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('¡Días seguidos!')).toBeInTheDocument();
      });
    });

    it('displays longest streak', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText(/10 días/i)).toBeInTheDocument();
      });
    });

    it('shows loading state for streak', async () => {
      (getUserStreak as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockStreak), 100))
      );

      render(<StatsPage />);

      expect(screen.getByText('...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });
  });

  describe('XP and Level Display', () => {
    it('displays total XP', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText(/90 XP/i)).toBeInTheDocument();
      });
    });

    it('displays current level', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Nivel 1/i)).toBeInTheDocument();
      });
    });

    it('shows progress bar for level', async () => {
      const { container } = render(<StatsPage />);

      await waitFor(() => {
        const progressBar = container.querySelector('.bg-parla-blue.rounded-full');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });

  describe('Weekly Activity Chart', () => {
    it('displays activity chart', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText('Actividad Semanal')).toBeInTheDocument();
      });
    });

    it('displays weekly stats', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Total semanal/i)).toBeInTheDocument();
        expect(screen.getByText(/Día más activo/i)).toBeInTheDocument();
      });
    });

    it('displays day labels', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText('Lun')).toBeInTheDocument();
        expect(screen.getByText('Mar')).toBeInTheDocument();
        expect(screen.getByText('Mié')).toBeInTheDocument();
      });
    });
  });

  describe('Motivation Message', () => {
    it('displays personalized motivation message with streak', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Vas por buen camino, John/i)).toBeInTheDocument();
        expect(screen.getByText(/Llevas 5 días seguidos/i)).toBeInTheDocument();
      });
    });

    it('displays different message when no streak', async () => {
      (getUserStreak as jest.Mock).mockResolvedValue({
        currentStreak: 0,
        longestStreak: 10,
      });

      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Comienza a jugar hoy/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('fetches streak data on mount', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(getUserStreak).toHaveBeenCalledWith('auth0|123');
      });
    });

    it('fetches game sessions on mount', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(getAllUserGameSessions).toHaveBeenCalledWith('auth0|123');
      });
    });

    it('handles empty sessions gracefully', async () => {
      (getAllUserGameSessions as jest.Mock).mockResolvedValue([]);

      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText('Mi Progreso')).toBeInTheDocument();
      });
    });
  });
});
