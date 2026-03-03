import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProvider } from "@/context/UserContext";
import HomePage from "@/app/page";

vi.mock("@/lib/api", () => ({
  getCategories: vi.fn(),
  getThreads: vi.fn(),
  likeThread: vi.fn(),
  unlikeThread: vi.fn(),
  createThread: vi.fn(),
}));

import { getCategories, getThreads } from "@/lib/api";

const mockCategories = [
  { _id: "c1", name: "Grammar", description: "Grammar topics", created_at: "" },
  { _id: "c2", name: "Vocabulary", description: "Vocab topics", created_at: "" },
];

const mockThread = {
  _id: "t1",
  category_id: "c1",
  user_id: "alice",
  title: "How to conjugate verbs?",
  content: "I struggle with conjugation.",
  tags: ["verbs"],
  likes: [],
  likes_count: 0,
  replies_count: 3,
  created_at: new Date().toISOString(),
  updated_at: null,
};

function renderHome() {
  return render(
    <UserProvider>
      <HomePage />
    </UserProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();

  (getCategories as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);
  (getThreads as ReturnType<typeof vi.fn>).mockResolvedValue({
    items: [mockThread],
    next_cursor: null,
    has_more: false,
  });
});

describe("HomePage", () => {
  it("fetches and renders categories", async () => {
    renderHome();

    expect(await screen.findByText("Grammar")).toBeInTheDocument();
    expect(screen.getByText("Vocabulary")).toBeInTheDocument();
    expect(getCategories).toHaveBeenCalledTimes(1);
  });

  it("fetches and renders threads", async () => {
    renderHome();

    expect(
      await screen.findByText("How to conjugate verbs?")
    ).toBeInTheDocument();
    expect(getThreads).toHaveBeenCalledWith({ limit: 10 });
  });

  it("renders section headings", async () => {
    renderHome();

    expect(await screen.findByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("New Thread")).toBeInTheDocument();
    expect(screen.getByText("Recent Threads")).toBeInTheDocument();
  });

  it("shows empty state when no categories", async () => {
    (getCategories as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderHome();

    expect(await screen.findByText("No categories yet.")).toBeInTheDocument();
  });

  it("shows empty state when no threads", async () => {
    (getThreads as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      next_cursor: null,
      has_more: false,
    });
    renderHome();

    expect(
      await screen.findByText(
        "No threads yet. Be the first to start a conversation!"
      )
    ).toBeInTheDocument();
  });

  it("shows Load more button when has_more is true", async () => {
    (getThreads as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [mockThread],
      next_cursor: "cursor-abc",
      has_more: true,
    });
    renderHome();

    expect(
      await screen.findByText("Load more threads")
    ).toBeInTheDocument();
  });

  it("does not show Load more button when has_more is false", async () => {
    renderHome();

    // Wait for threads to load
    await screen.findByText("How to conjugate verbs?");
    expect(screen.queryByText("Load more threads")).not.toBeInTheDocument();
  });
});
