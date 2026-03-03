import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThreadComposer } from "@/components/ThreadComposer";
import { UserProvider } from "@/context/UserContext";
import type { Category } from "@/lib/types";

// Mock createThread from api
vi.mock("@/lib/api", () => ({
  createThread: vi.fn(),
}));

import { createThread } from "@/lib/api";

const mockCategories: Category[] = [
  { _id: "cat-1", name: "Grammar", description: "d", created_at: "" },
  { _id: "cat-2", name: "Vocabulary", description: "d", created_at: "" },
];

const mockOnCreated = vi.fn();

function renderComposer() {
  return render(
    <UserProvider>
      <ThreadComposer categories={mockCategories} onCreated={mockOnCreated} />
    </UserProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("ThreadComposer", () => {
  it("shows placeholder message when no userId is set", () => {
    renderComposer();
    expect(
      screen.getByText("Enter your User ID in the top bar to start a new thread.")
    ).toBeInTheDocument();
  });

  it("shows collapsed state with prompt text when userId is set", async () => {
    localStorage.setItem("parla-user-id", "alice");
    renderComposer();

    await vi.waitFor(() => {
      expect(screen.getByText("Start a new thread...")).toBeInTheDocument();
    });
  });

  it("expands on click to show the form", async () => {
    localStorage.setItem("parla-user-id", "alice");
    const user = userEvent.setup();
    renderComposer();

    await vi.waitFor(() => {
      expect(screen.getByText("Start a new thread...")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Start a new thread..."));

    expect(screen.getByPlaceholderText("Thread title")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("What do you want to discuss?")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Tags (comma-separated)")
    ).toBeInTheDocument();
  });

  it("shows category dropdown with options", async () => {
    localStorage.setItem("parla-user-id", "alice");
    const user = userEvent.setup();
    renderComposer();

    await vi.waitFor(() => {
      expect(screen.getByText("Start a new thread...")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Start a new thread..."));

    const select = screen.getByDisplayValue("Category...");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Grammar")).toBeInTheDocument();
    expect(screen.getByText("Vocabulary")).toBeInTheDocument();
  });

  it("collapses on Cancel click", async () => {
    localStorage.setItem("parla-user-id", "alice");
    const user = userEvent.setup();
    renderComposer();

    await vi.waitFor(() => {
      expect(screen.getByText("Start a new thread...")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Start a new thread..."));
    expect(screen.getByPlaceholderText("Thread title")).toBeInTheDocument();

    await user.click(screen.getByText("Cancel"));
    expect(screen.getByText("Start a new thread...")).toBeInTheDocument();
  });

  it("submits the form and calls onCreated", async () => {
    localStorage.setItem("parla-user-id", "alice");
    const user = userEvent.setup();

    const mockThread = {
      _id: "t1",
      category_id: "cat-1",
      title: "Test Thread",
      content: "Test content",
      tags: ["test"],
      user_id: "alice",
      likes: [],
      likes_count: 0,
      replies_count: 0,
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    (createThread as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockThread);

    renderComposer();

    await vi.waitFor(() => {
      expect(screen.getByText("Start a new thread...")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Start a new thread..."));

    // Fill form
    const select = screen.getByDisplayValue("Category...");
    await user.selectOptions(select, "cat-1");
    await user.type(screen.getByPlaceholderText("Thread title"), "Test Thread");
    await user.type(
      screen.getByPlaceholderText("What do you want to discuss?"),
      "Test content"
    );
    await user.type(
      screen.getByPlaceholderText("Tags (comma-separated)"),
      "test"
    );

    await user.click(screen.getByText("Post"));

    await vi.waitFor(() => {
      expect(createThread).toHaveBeenCalledWith({
        category_id: "cat-1",
        title: "Test Thread",
        content: "Test content",
        tags: ["test"],
      });
      expect(mockOnCreated).toHaveBeenCalledWith(mockThread);
    });
  });
});
