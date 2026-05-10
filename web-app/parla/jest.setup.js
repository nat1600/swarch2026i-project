// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_CORE_API_URL = 'http://localhost:8000'

// Mock @auth0/nextjs-auth0 to avoid ES module issues
// Note: useUser is mocked in individual test files to allow customization
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: jest.fn(() => ({
    user: null,
    error: null,
    isLoading: false,
  })),
  UserProvider: ({ children }) => children,
  UserProfile: {},
  UserContext: {},
}))

jest.mock('@auth0/nextjs-auth0', () => ({
  getSession: jest.fn(),
  getAccessToken: jest.fn(),
  withApiAuthRequired: jest.fn((handler) => handler),
  withPageAuthRequired: jest.fn((component) => component),
}))

// Mock lib/auth0
jest.mock('./lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
    getAccessToken: jest.fn(),
  },
}))

// Mock next/navigation
// Note: useRouter is mocked in individual test files to allow customization
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))
