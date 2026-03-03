import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProvider } from "@/context/UserContext";
import CategoryDetailPage from "@/app/categories/[id]/page";

vi.mock("@/lib/api", () => ({
  getCategory: vi.fn(),
  getThreads: vi.fn(),
  likeThread: vi.fn(),
  unlikeThread: vi.fn(),
}));

// Override the default next/navigation mock to provide params
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    forward: vi.fn(),
  }),
  useParams: () => ({ id: "cat-1" }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/categories/cat-1",
}));

import { getCategory, getThreads } from "@/lib/api";

const mockCategory = {
  _id: "cat-1",
  name: "Grammar",
  description: "Discuss grammar rules",
  created_at: "",
};

const mockThread = {
  _id: "t1",
  category_id: "cat-1",
  user_id: "alice",
  title: "Verb conjugation help",
  content: "Need help with verbs",
  tags: ["verbs", "spanish"],
  likes: [],
  likes_count: 0,
  replies_count: 2,
  created_at: new Date().toISOString(),
  updated_at: null,
};

function renderPage() {
  return render(
    <UserProvider>
      <CategoryDetailPage />
    </UserProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();

  (getCategory as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategory);
  (getThreads as ReturnType<typeof vi.fn>).mockResolvedValue({
    items: [mockThread],
    next_cursor: null,
    has_more: false,
  });
});

describe("CategoryDetailPage", () => {
  it("fetches and renders the category name", async () => {
    renderPage();
    expect(await screen.findByText("Grammar")).toBeInTheDocument();
    expect(getCategory).toHaveBeenCalledWith("cat-1");
  });

  it("renders the category description", async () => {
    renderPage();
    expect(
      await screen.findByText("Discuss grammar rules")
    ).toBeInTheDocument();
  });

  it("fetches and renders threads for the category", async () => {
    renderPage();
    expect(
      await screen.findByText("Verb conjugation help")
    ).toBeInTheDocument();
    expect(getThreads).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: "cat-1", limit: 10 })
    );
  });

  it("renders tag filter badges from thread tags", async () => {
    renderPage();
    const verbsElements = await screen.findAllByText("verbs");
    expect(verbsElements.length).toBeGreaterThanOrEqual(1);
    const spanishElements = screen.getAllByText("spanish");
    expect(spanishElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Back to home link", async () => {
    renderPage();
    const backLink = await screen.findByText("Back to home");
    expect(backLink.closest("a")).toHaveAttribute("href", "/");
  });

  it("shows empty state when no threads in category", async () => {
    (getThreads as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      next_cursor: null,
      has_more: false,
    });
    renderPage();

    expect(
      await screen.findByText("No threads in this category yet.")
    ).toBeInTheDocument();
  });

  it("shows Category not found when category fetch fails", async () => {
    (getCategory as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Not found")
    );
    renderPage();

    expect(
      await screen.findByText("Category not found.")
    ).toBeInTheDocument();
  });
});
