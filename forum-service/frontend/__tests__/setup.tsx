import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// ── Mock next/navigation ────────────────────────────────────
const pushMock = vi.fn();
const replaceMock = vi.fn();
const backMock = vi.fn();
const prefetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    back: backMock,
    prefetch: prefetchMock,
    refresh: vi.fn(),
    forward: vi.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// ── Mock next/link ──────────────────────────────────────────
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { prefetch, ...htmlProps } = rest;
    return (
      <a href={href} {...htmlProps}>
        {children}
      </a>
    );
  },
}));

// ── Expose router mocks for tests ───────────────────────────
export { pushMock, replaceMock, backMock, prefetchMock };
