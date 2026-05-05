import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingPage from '../page';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { registerUserAction, checkUserExistsAction } from '@/actions/auth/authActions';

jest.mock('@auth0/nextjs-auth0/client');
jest.mock('next/navigation');
jest.mock('@/actions/auth/authActions');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUser = {
  sub: 'auth0|123',
  email: 'test@example.com',
  given_name: 'John',
};

describe('OnboardingPage Integration Tests', () => {
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
    
    (checkUserExistsAction as jest.Mock).mockResolvedValue({ exists: false });
    (registerUserAction as jest.Mock).mockResolvedValue({ success: true });
  });

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', async () => {
      (useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(<OnboardingPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('shows loading state while checking authentication', () => {
      (useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(<OnboardingPage />);

      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    });

    it('redirects to home if user already exists in database', async () => {
      (checkUserExistsAction as jest.Mock).mockResolvedValue({ exists: true });

      render(<OnboardingPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/home');
      });
    });
  });

  describe('Form Rendering', () => {
    it('renders onboarding form', async () => {
      render(<OnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText('¡Casi listos!')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/qué idioma hablas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/qué idioma quieres aprender/i)).toBeInTheDocument();
    });

    it('displays all language options', async () => {
      render(<OnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText('¡Casi listos!')).toBeInTheDocument();
      });

      expect(screen.getByText(/español/i)).toBeInTheDocument();
      expect(screen.getByText(/inglés/i)).toBeInTheDocument();
      expect(screen.getByText(/francés/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates username length (minimum)', async () => {
      const user = userEvent.setup();
      render(<OnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText('¡Casi listos!')).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(/ninja_poliglota/i);
      await user.type(usernameInput, 'ab');

      const submitButton = screen.getByRole('button', { name: /empezar aventura/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/al menos 3 letras/i)).toBeInTheDocument();
      });
    });

    it('validates username format', async () => {
      const user = userEvent.setup();
      render(<OnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText('¡Casi listos!')).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(/ninja_poliglota/i);
      await user.type(usernameInput, 'invalid@user');

      const submitButton = screen.getByRole('button', { name: /empezar aventura/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/solo letras, números y guiones bajos/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      render(<OnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText('¡Casi listos!')).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(/ninja_poliglota/i);
      await user.type(usernameInput, 'testuser123');

      const nativeLanguageSelect = screen.getByLabelText(/qué idioma hablas/i);
      await user.selectOptions(nativeLanguageSelect, 'Spanish');

      const learningLanguageSelect = screen.getByLabelText(/qué idioma quieres aprender/i);
      await user.selectOptions(learningLanguageSelect, 'English');

      const submitButton = screen.getByRole('button', { name: /empezar aventura/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(registerUserAction).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'testuser123',
            email: 'test@example.com',
            native_language: 'Spanish',
            learning_language: 'English',
          })
        );
      });
    });

    it('redirects to home after successful registration', async () => {
      const user = userEvent.setup();
      render(<OnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText('¡Casi listos!')).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(/ninja_poliglota/i);
      await user.type(usernameInput, 'testuser123');

      const submitButton = screen.getByRole('button', { name: /empezar aventura/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/home');
      });
    });

    it('handles registration error', async () => {
      const user = userEvent.setup();
      (registerUserAction as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Username already taken',
      });

      render(<OnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText('¡Casi listos!')).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(/ninja_poliglota/i);
      await user.type(usernameInput, 'testuser123');

      const submitButton = screen.getByRole('button', { name: /empezar aventura/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(registerUserAction).toHaveBeenCalled();
      });
    });

    it('disables submit button while submitting', async () => {
      const user = userEvent.setup();
      (registerUserAction as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<OnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText('¡Casi listos!')).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(/ninja_poliglota/i);
      await user.type(usernameInput, 'testuser123');

      const submitButton = screen.getByRole('button', { name: /empezar aventura/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Progress Indicator', () => {
    it('displays progress bar', async () => {
      render(<OnboardingPage />);

      await waitFor(() => {
        expect(screen.getByText('¡Casi listos!')).toBeInTheDocument();
      });

      const progressBar = screen.getByText('1');
      expect(progressBar).toBeInTheDocument();
    });
  });
});
