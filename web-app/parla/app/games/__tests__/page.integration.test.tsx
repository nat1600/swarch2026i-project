import { render, screen } from '@testing-library/react';
import GamesPage from '../page';

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('GamesPage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders games page with title', () => {
      render(<GamesPage />);

      expect(screen.getByText(/juegos/i)).toBeInTheDocument();
    });

    it('displays all game cards', () => {
      render(<GamesPage />);

      expect(screen.getByText(/completar espacios/i)).toBeInTheDocument();
      expect(screen.getByText(/emparejar palabras/i)).toBeInTheDocument();
      expect(screen.getByText(/escritura rápida/i)).toBeInTheDocument();
    });

    it('shows back button', () => {
      render(<GamesPage />);

      const backLink = screen.getByRole('link', { name: /volver/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/home');
    });
  });

  describe('Game Cards', () => {
    it('displays fill-in-the-blank game card', () => {
      render(<GamesPage />);

      expect(screen.getByText(/completar espacios/i)).toBeInTheDocument();
    });

    it('displays word-match game card', () => {
      render(<GamesPage />);

      expect(screen.getByText(/emparejar palabras/i)).toBeInTheDocument();
    });

    it('displays typing game card', () => {
      render(<GamesPage />);

      expect(screen.getByText(/escritura rápida/i)).toBeInTheDocument();
    });

    it('game cards have correct links', () => {
      render(<GamesPage />);

      const links = screen.getAllByRole('link');
      const gameLinks = links.filter(link => link.getAttribute('href')?.includes('/games/'));
      
      expect(gameLinks.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Navigation', () => {
    it('back button links to home', () => {
      render(<GamesPage />);

      const backLink = screen.getByRole('link', { name: /volver/i });
      expect(backLink).toHaveAttribute('href', '/home');
    });
  });

  describe('Responsive Layout', () => {
    it('renders grid layout for game cards', () => {
      const { container } = render(<GamesPage />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });
});
