import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReplyCard } from "@/components/ReplyCard";
import { UserProvider } from "@/context/UserContext";
import type { Reply } from "@/lib/types";

// Mock api functions used by LikeButton and ReplyForm inside ReplyCard
vi.mock("@/lib/api", () => ({
  likeReply: vi.fn(),
  unlikeReply: vi.fn(),
  createReply: vi.fn(),
}));

const mockReply: Reply = {
  _id: "r1",
  thread_id: "t1",
  user_id: "alice",
  content: "This is a great thread!",
  parent_reply_id: null,
  likes: [],
  likes_count: 2,
  created_at: new Date().toISOString(),
  updated_at: null,
};

const childReply: Reply = {
  _id: "r2",
  thread_id: "t1",
  user_id: "bob",
  content: "I agree with this!",
  parent_reply_id: "r1",
  likes: [],
  likes_count: 0,
  created_at: new Date().toISOString(),
  updated_at: null,
};

const mockOnReplyCreated = vi.fn();
const mockOnReplyUpdated = vi.fn();

function renderReplyCard(
  props: {
    reply?: Reply;
    depth?: number;
    childReplies?: Reply[];
    onEdit?: (reply: Reply) => void;
    onDelete?: (reply: Reply) => void;
  } = {}
) {
  return render(
    <UserProvider>
      <ReplyCard
        reply={props.reply ?? mockReply}
        threadId="t1"
        depth={props.depth ?? 0}
        childReplies={props.childReplies ?? []}
        onReplyCreated={mockOnReplyCreated}
        onReplyUpdated={mockOnReplyUpdated}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
      />
    </UserProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("ReplyCard", () => {
  it("renders the reply content", () => {
    renderReplyCard();
    expect(screen.getByText("This is a great thread!")).toBeInTheDocument();
  });

  it("renders the user_id", () => {
    renderReplyCard();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("renders the like count", () => {
    renderReplyCard();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows edited indicator when updated_at is set", () => {
    renderReplyCard({
      reply: { ...mockReply, updated_at: new Date().toISOString() },
    });
    expect(screen.getByText("edited")).toBeInTheDocument();
  });

  it("does not show edited indicator when updated_at is null", () => {
    renderReplyCard();
    expect(screen.queryByText("edited")).not.toBeInTheDocument();
  });

  it("renders child replies", () => {
    renderReplyCard({ childReplies: [childReply] });
    expect(screen.getByText("I agree with this!")).toBeInTheDocument();
  });

  it("applies indentation classes at depth > 0", () => {
    const { container } = renderReplyCard({ depth: 1 });
    const indented = container.querySelector(".ml-4.pl-4.border-l-2");
    expect(indented).toBeTruthy();
  });

  it("does not apply indentation at depth 0", () => {
    const { container } = renderReplyCard({ depth: 0 });
    const indented = container.querySelector(".ml-4.pl-4.border-l-2");
    expect(indented).toBeNull();
  });

  it("shows Reply button", () => {
    renderReplyCard();
    // There's a "Reply" text button in the card
    expect(screen.getByText("Reply")).toBeInTheDocument();
  });

  it("shows Edit and Delete buttons when user is the author", async () => {
    localStorage.setItem("parla-user-id", "alice");
    renderReplyCard({
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    await vi.waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });

  it("does not show Edit/Delete when user is not the author", async () => {
    localStorage.setItem("parla-user-id", "charlie");
    renderReplyCard({
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });

    await vi.waitFor(() => {
      // charlie !== alice, so no edit/delete
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });
  });

  it("toggles inline reply form on Reply button click", async () => {
    localStorage.setItem("parla-user-id", "bob");
    const user = userEvent.setup();
    renderReplyCard();

    await vi.waitFor(() => {
      expect(screen.getByText("Reply")).toBeInTheDocument();
    });

    // Initially no reply form
    expect(
      screen.queryByPlaceholderText(/Reply to alice/)
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("Reply"));

    // Now the reply form should appear
    expect(
      screen.getByPlaceholderText("Reply to alice...")
    ).toBeInTheDocument();
  });
});
