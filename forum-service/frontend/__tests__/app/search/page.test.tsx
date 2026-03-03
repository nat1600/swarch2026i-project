import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProvider } from "@/context/UserContext";
import SearchPage from "@/app/search/page";

vi.mock("@/lib/api", () => ({
  searchThreads: vi.fn(),
  likeThread: vi.fn(),
  unlikeThread: vi.fn(),
}));

// Mock with a query param of "spanish"
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    forward: vi.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams("q=spanish"),
  usePathname: () => "/search",
}));

import { searchThreads } from "@/lib/api";

const mockThread = {
  _id: "t1",
  category_id: "cat-1",
  user_id: "alice",
  title: "Spanish verb tenses",
  content: "Let me explain the different tenses...",
  tags: ["spanish"],
  likes: [],
  likes_count: 0,
  replies_count: 0,
  created_at: new Date().toISOString(),
  updated_at: null,
};

function renderPage() {
  return render(
    <UserProvider>
      <SearchPage />
    </UserProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();

  (searchThreads as ReturnType<typeof vi.fn>).mockResolvedValue({
    items: [mockThread],
    next_cursor: null,
    has_more: false,
  });
});

describe("SearchPage", () => {
  it("renders the Search Results heading", async () => {
    renderPage();
    expect(await screen.findByText("Search Results")).toBeInTheDocument();
  });

  it("shows the search query text", async () => {
    renderPage();
    expect(
      await screen.findByText(/Showing results for/)
    ).toBeInTheDocument();
  });

  it("calls searchThreads with the query param", async () => {
    renderPage();

    await screen.findByText("Spanish verb tenses");
    expect(searchThreads).toHaveBeenCalledWith(
      expect.objectContaining({ q: "spanish", limit: 10 })
    );
  });

  it("renders matching threads", async () => {
    renderPage();
    expect(
      await screen.findByText("Spanish verb tenses")
    ).toBeInTheDocument();
  });

  it("shows no results message when no threads match", async () => {
    (searchThreads as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      next_cursor: null,
      has_more: false,
    });

    renderPage();

    expect(
      await screen.findByText(/No threads found for/)
    ).toBeInTheDocument();
  });

  it("shows Load more button when has_more is true", async () => {
    (searchThreads as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [mockThread],
      next_cursor: "cursor-1",
      has_more: true,
    });

    renderPage();

    expect(
      await screen.findByText("Load more results")
    ).toBeInTheDocument();
  });
});
