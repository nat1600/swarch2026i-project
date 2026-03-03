import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProvider } from "@/context/UserContext";
import ThreadDetailPage from "@/app/threads/[id]/page";

vi.mock("@/lib/api", () => ({
  getThread: vi.fn(),
  getReplies: vi.fn(),
  likeThread: vi.fn(),
  unlikeThread: vi.fn(),
  deleteThread: vi.fn(),
  deleteReply: vi.fn(),
  updateReply: vi.fn(),
  likeReply: vi.fn(),
  unlikeReply: vi.fn(),
  createReply: vi.fn(),
  updateThread: vi.fn(),
}));

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
  useParams: () => ({ id: "t1" }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/threads/t1",
}));

import { getThread, getReplies } from "@/lib/api";

const mockThread = {
  _id: "t1",
  category_id: "cat-1",
  user_id: "alice",
  title: "How to learn Spanish?",
  content: "I want to be fluent in 6 months. Any advice?",
  tags: ["spanish", "learning"],
  likes: ["bob"],
  likes_count: 1,
  replies_count: 2,
  created_at: new Date().toISOString(),
  updated_at: null,
};

const mockReplies = [
  {
    _id: "r1",
    thread_id: "t1",
    user_id: "bob",
    content: "Try immersive learning!",
    parent_reply_id: null,
    likes: [],
    likes_count: 0,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    _id: "r2",
    thread_id: "t1",
    user_id: "charlie",
    content: "Duolingo is great.",
    parent_reply_id: null,
    likes: [],
    likes_count: 0,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
];

function renderPage() {
  return render(
    <UserProvider>
      <ThreadDetailPage />
    </UserProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();

  (getThread as ReturnType<typeof vi.fn>).mockResolvedValue(mockThread);
  (getReplies as ReturnType<typeof vi.fn>).mockResolvedValue({
    items: mockReplies,
    next_cursor: null,
    has_more: false,
  });
});

describe("ThreadDetailPage", () => {
  it("fetches and renders the thread title", async () => {
    renderPage();
    expect(
      await screen.findByText("How to learn Spanish?")
    ).toBeInTheDocument();
    expect(getThread).toHaveBeenCalledWith("t1");
  });

  it("renders the thread content", async () => {
    renderPage();
    expect(
      await screen.findByText("I want to be fluent in 6 months. Any advice?")
    ).toBeInTheDocument();
  });

  it("renders thread tags", async () => {
    renderPage();
    expect(await screen.findByText("spanish")).toBeInTheDocument();
    expect(screen.getByText("learning")).toBeInTheDocument();
  });

  it("renders the thread user_id", async () => {
    renderPage();
    expect(await screen.findByText("alice")).toBeInTheDocument();
  });

  it("renders replies", async () => {
    renderPage();
    expect(
      await screen.findByText("Try immersive learning!")
    ).toBeInTheDocument();
    expect(screen.getByText("Duolingo is great.")).toBeInTheDocument();
  });

  it("renders the Replies heading", async () => {
    renderPage();
    expect(await screen.findByText("Replies")).toBeInTheDocument();
  });

  it("shows Back to home link", async () => {
    renderPage();
    const backLink = await screen.findByText("Back to home");
    expect(backLink.closest("a")).toHaveAttribute("href", "/");
  });

  it("shows Thread not found when fetch fails", async () => {
    (getThread as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Not found")
    );
    renderPage();

    expect(await screen.findByText("Thread not found.")).toBeInTheDocument();
  });

  it("shows empty replies state", async () => {
    (getReplies as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      next_cursor: null,
      has_more: false,
    });
    renderPage();

    expect(
      await screen.findByText("No replies yet. Be the first to reply!")
    ).toBeInTheDocument();
  });

  it("shows Edit and Delete buttons when user is the author", async () => {
    localStorage.setItem("parla-user-id", "alice");
    renderPage();

    // Wait for thread to load and userId to be read from localStorage
    await screen.findByText("How to learn Spanish?");

    await vi.waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });

  it("does not show Edit/Delete when user is not the author", async () => {
    localStorage.setItem("parla-user-id", "bob");
    renderPage();

    await screen.findByText("How to learn Spanish?");

    // Buttons should not be present (at the thread level)
    // Note: there may be Edit/Delete on replies — we check the thread author actions
    await vi.waitFor(() => {
      // The thread-level edit button has the Pencil icon alongside text "Edit"
      const buttons = screen.getAllByRole("button");
      const editBtn = buttons.find(
        (b) =>
          b.textContent?.includes("Edit") &&
          b.closest("[class*='border-amber']")
      );
      expect(editBtn).toBeUndefined();
    });
  });
});
