import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LikeButton } from "@/components/LikeButton";
import { UserProvider } from "@/context/UserContext";

function renderLikeButton(
  props: Partial<{
    likes: string[];
    likesCount: number;
    onLike: () => Promise<void>;
    onUnlike: () => Promise<void>;
  }> = {}
) {
  const defaultProps = {
    likes: [],
    likesCount: 0,
    onLike: vi.fn().mockResolvedValue(undefined),
    onUnlike: vi.fn().mockResolvedValue(undefined),
    ...props,
  };

  return {
    ...render(
      <UserProvider>
        <LikeButton {...defaultProps} />
      </UserProvider>
    ),
    props: defaultProps,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("LikeButton", () => {
  it("renders the like count", () => {
    renderLikeButton({ likesCount: 42 });
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("is disabled when no userId is set", () => {
    renderLikeButton();
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("is enabled when userId is set", async () => {
    localStorage.setItem("parla-user-id", "alice");
    renderLikeButton();

    await vi.waitFor(() => {
      expect(screen.getByRole("button")).toBeEnabled();
    });
  });

  it("calls onLike when clicked and not yet liked", async () => {
    localStorage.setItem("parla-user-id", "alice");
    const user = userEvent.setup();
    const { props } = renderLikeButton({ likes: [], likesCount: 5 });

    await vi.waitFor(() => {
      expect(screen.getByRole("button")).toBeEnabled();
    });

    await user.click(screen.getByRole("button"));
    expect(props.onLike).toHaveBeenCalledTimes(1);
  });

  it("calls onUnlike when clicked and already liked", async () => {
    localStorage.setItem("parla-user-id", "alice");
    const user = userEvent.setup();
    const { props } = renderLikeButton({
      likes: ["alice"],
      likesCount: 1,
    });

    await vi.waitFor(() => {
      expect(screen.getByRole("button")).toBeEnabled();
    });

    await user.click(screen.getByRole("button"));
    expect(props.onUnlike).toHaveBeenCalledTimes(1);
  });

  it("shows optimistic count increment on like", async () => {
    localStorage.setItem("parla-user-id", "alice");
    const user = userEvent.setup();
    // Use a never-resolving promise to keep optimistic state visible
    const onLike = vi.fn().mockReturnValue(new Promise(() => {}));

    render(
      <UserProvider>
        <LikeButton
          likes={[]}
          likesCount={3}
          onLike={onLike}
          onUnlike={vi.fn()}
        />
      </UserProvider>
    );

    await vi.waitFor(() => {
      expect(screen.getByRole("button")).toBeEnabled();
    });

    await user.click(screen.getByRole("button"));
    // Optimistic: 3 -> 4
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
