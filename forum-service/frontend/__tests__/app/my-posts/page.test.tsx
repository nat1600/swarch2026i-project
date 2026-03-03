import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProvider } from "@/context/UserContext";
import MyPostsPage from "@/app/my-posts/page";

vi.mock("@/lib/api", () => ({
  getThreads: vi.fn(),
  likeThread: vi.fn(),
  unlikeThread: vi.fn(),
}));

import { getThreads } from "@/lib/api";

const mockThread = {
  _id: "t1",
  category_id: "cat-1",
  user_id: "alice",
  title: "My first thread",
  content: "Hello everyone!",
  tags: [],
  likes: [],
  likes_count: 0,
  replies_count: 0,
  created_at: new Date().toISOString(),
  updated_at: null,
};

function renderPage() {
  return render(
    <UserProvider>
      <MyPostsPage />
    </UserProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();

  (getThreads as ReturnType<typeof vi.fn>).mockResolvedValue({
    items: [mockThread],
    next_cursor: null,
    has_more: false,
  });
});

describe("MyPostsPage", () => {
  it("renders the My Posts heading", () => {
    renderPage();
    expect(screen.getByText("My Posts")).toBeInTheDocument();
  });

  it("shows prompt when no userId is set", () => {
    renderPage();
    expect(
      screen.getByText("Enter your User ID in the top bar to see your posts.")
    ).toBeInTheDocument();
  });

  it("does not fetch threads when no userId is set", () => {
    renderPage();
    expect(getThreads).not.toHaveBeenCalled();
  });

  it("fetches and renders user threads when userId is set", async () => {
    localStorage.setItem("parla-user-id", "alice");
    renderPage();

    expect(await screen.findByText("My first thread")).toBeInTheDocument();
    expect(getThreads).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "alice", limit: 10 })
    );
  });

  it("shows the My Threads tab", async () => {
    localStorage.setItem("parla-user-id", "alice");
    renderPage();

    expect(await screen.findByText("My Threads")).toBeInTheDocument();
  });

  it("shows empty state when user has no threads", async () => {
    localStorage.setItem("parla-user-id", "alice");
    (getThreads as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      next_cursor: null,
      has_more: false,
    });

    renderPage();

    expect(
      await screen.findByText("You haven't created any threads yet.")
    ).toBeInTheDocument();
  });

  it("shows Load more button when has_more is true", async () => {
    localStorage.setItem("parla-user-id", "alice");
    (getThreads as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [mockThread],
      next_cursor: "cursor-1",
      has_more: true,
    });

    renderPage();

    expect(await screen.findByText("Load more")).toBeInTheDocument();
  });
});
