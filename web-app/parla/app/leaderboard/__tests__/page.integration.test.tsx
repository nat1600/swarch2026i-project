import { render, screen, waitFor } from '@testing-library/react';
import LeaderboardPage from '../page';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getLeaderboard } from '@/lib/api/gamificationService';

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
};

const mockLeaderboard = [
  {
    userId: 'auth0|123',
    username: 'John',
    totalXP: 1000,
    rank: 1,
  },
  {
    userId: 'auth0|456',
    username: 'Jane',
    totalXP: 800,
    rank: 2,
  },
  {
    userId: 'auth0|789',
    username: 'Bob',
    totalXP: 600,
    rank: 3,
  },
];

describe('LeaderboardPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
    });
    
    (getLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboard);
  });

  describe('Page Rendering', () => {
    it('renders leaderboard page with title', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/tabla de posiciones/i)).toBeInTheDocument();
      });
    });

    it('shows back button', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /volver/i });
        expect(backLink).toBeInTheDocument();
      });
    });
  });

  describe('Leaderboard Display', () => {
    it('displays all leaderboard entries', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.getByText('Jane')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });
    });

    it('displays XP for each user', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/1000/)).toBeInTheDocument();
        expect(screen.getByText(/800/)).toBeInTheDocument();
        expect(screen.getByText(/600/)).toBeInTheDocument();
      });
    });

    it('highlights current user', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        const userEntry = screen.getByText('John').closest('div');
        expect(userEntry).toHaveClass('bg-parla-blue');
      });
    });
  });

  describe('Data Fetching', () => {
    it('fetches leaderboard data on mount', async () => {
      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(getLeaderboard).toHaveBeenCalled();
      });
    });

    it('handles empty leaderboard', async () => {
      (getLeaderboard as jest.Mock).mockResolvedValue([]);

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/no hay datos/i)).toBeInTheDocument();
      });
    });

    it('handles fetch error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (getLeaderboard as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});
