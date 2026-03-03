import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReplyForm } from "@/components/ReplyForm";
import { UserProvider } from "@/context/UserContext";

vi.mock("@/lib/api", () => ({
  createReply: vi.fn(),
}));

import { createReply } from "@/lib/api";

const mockOnCreated = vi.fn();
const mockOnCancel = vi.fn();

function renderReplyForm(props: { compact?: boolean; onCancel?: () => void } = {}) {
  return render(
    <UserProvider>
      <ReplyForm
        threadId="t1"
        onCreated={mockOnCreated}
        onCancel={props.onCancel}
        compact={props.compact}
      />
    </UserProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("ReplyForm", () => {
  it("shows message when no userId is set", () => {
    renderReplyForm();
    expect(
      screen.getByText("Enter your User ID to reply.")
    ).toBeInTheDocument();
  });

  it("shows the form when userId is set", async () => {
    localStorage.setItem("parla-user-id", "alice");
    renderReplyForm();

    await vi.waitFor(() => {
      expect(
        screen.getByPlaceholderText("Write a reply...")
      ).toBeInTheDocument();
    });
  });

  it("shows Reply button", async () => {
    localStorage.setItem("parla-user-id", "alice");
    renderReplyForm();

    await vi.waitFor(() => {
      expect(screen.getByText("Reply")).toBeInTheDocument();
    });
  });

  it("shows Cancel button when onCancel is provided", async () => {
    localStorage.setItem("parla-user-id", "alice");
    renderReplyForm({ onCancel: mockOnCancel });

    await vi.waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  it("does not show Cancel button when onCancel is not provided", async () => {
    localStorage.setItem("parla-user-id", "alice");
    renderReplyForm();

    await vi.waitFor(() => {
      expect(screen.getByText("Reply")).toBeInTheDocument();
    });
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    localStorage.setItem("parla-user-id", "alice");
    const user = userEvent.setup();
    renderReplyForm({ onCancel: mockOnCancel });

    await vi.waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Cancel"));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("submits reply and calls onCreated", async () => {
    localStorage.setItem("parla-user-id", "alice");
    const user = userEvent.setup();

    const mockReply = {
      _id: "r1",
      thread_id: "t1",
      user_id: "alice",
      content: "Great post!",
      parent_reply_id: null,
      likes: [],
      likes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    (createReply as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockReply);

    renderReplyForm();

    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText("Write a reply...")).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText("Write a reply..."),
      "Great post!"
    );
    await user.click(screen.getByText("Reply"));

    await vi.waitFor(() => {
      expect(createReply).toHaveBeenCalledWith("t1", {
        content: "Great post!",
        parent_reply_id: null,
      });
      expect(mockOnCreated).toHaveBeenCalledWith(mockReply);
    });
  });
});
