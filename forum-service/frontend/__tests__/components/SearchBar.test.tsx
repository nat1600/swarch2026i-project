import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "@/components/SearchBar";

// Access the mocked router push
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    forward: vi.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SearchBar", () => {
  it("renders the search input", () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText("Search threads...")).toBeInTheDocument();
  });

  it("navigates on Enter key press", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search threads...");
    await user.type(input, "react hooks");
    await user.keyboard("{Enter}");

    expect(mockPush).toHaveBeenCalledWith(
      "/search?q=react%20hooks"
    );
  });

  it("does not navigate on Enter with empty query", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search threads...");
    await user.click(input);
    await user.keyboard("{Enter}");

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("debounces navigation on typing (300ms)", async () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search threads...");

    // Simulate typing by firing change events
    // We use fireEvent since userEvent doesn't work well with fake timers
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(input, { target: { value: "test" } });

    // Not yet navigated
    expect(mockPush).not.toHaveBeenCalled();

    // Advance past debounce
    vi.advanceTimersByTime(300);

    expect(mockPush).toHaveBeenCalledWith("/search?q=test");
  });

  it("does not navigate on debounce with whitespace-only query", () => {
    render(<SearchBar />);

    const { fireEvent } = require("@testing-library/react");
    const input = screen.getByPlaceholderText("Search threads...");
    fireEvent.change(input, { target: { value: "   " } });

    vi.advanceTimersByTime(300);

    expect(mockPush).not.toHaveBeenCalled();
  });
});
