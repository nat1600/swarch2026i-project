import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThreadCard } from "@/components/ThreadCard";
import { UserProvider } from "@/context/UserContext";
import type { Thread } from "@/lib/types";

// Mock the API functions used by LikeButton inside ThreadCard
vi.mock("@/lib/api", () => ({
  likeThread: vi.fn(),
  unlikeThread: vi.fn(),
}));

const mockThread: Thread = {
  _id: "t1",
  category_id: "cat-1",
  user_id: "alice",
  title: "How to learn Spanish fast?",
  content: "I want to improve my Spanish skills. Any tips?",
  tags: ["spanish", "tips"],
  likes: ["bob"],
  likes_count: 1,
  replies_count: 5,
  created_at: new Date().toISOString(),
  updated_at: null,
};

function renderThreadCard(thread = mockThread) {
  return render(
    <UserProvider>
      <ThreadCard thread={thread} />
    </UserProvider>
  );
}

describe("ThreadCard", () => {
  it("renders the thread title", () => {
    renderThreadCard();
    expect(screen.getByText("How to learn Spanish fast?")).toBeInTheDocument();
  });

  it("renders the content preview", () => {
    renderThreadCard();
    expect(
      screen.getByText("I want to improve my Spanish skills. Any tips?")
    ).toBeInTheDocument();
  });

  it("renders tags as TagBadges", () => {
    renderThreadCard();
    expect(screen.getByText("spanish")).toBeInTheDocument();
    expect(screen.getByText("tips")).toBeInTheDocument();
  });

  it("renders the like count", () => {
    renderThreadCard();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders the reply count", () => {
    renderThreadCard();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders the user_id", () => {
    renderThreadCard();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("links to the thread detail page", () => {
    renderThreadCard();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/threads/t1");
  });

  it("shows edited badge when updated_at is set", () => {
    renderThreadCard({
      ...mockThread,
      updated_at: new Date().toISOString(),
    });
    expect(screen.getByText("edited")).toBeInTheDocument();
  });

  it("does not show edited badge when updated_at is null", () => {
    renderThreadCard();
    expect(screen.queryByText("edited")).not.toBeInTheDocument();
  });

  it("does not render tags section when tags array is empty", () => {
    renderThreadCard({ ...mockThread, tags: [] });
    expect(screen.queryByText("spanish")).not.toBeInTheDocument();
  });
});
