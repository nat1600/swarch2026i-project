import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserProvider, useUser } from "@/context/UserContext";

// Helper component that exposes the hook
function TestConsumer() {
  const { userId, setUserId } = useUser();
  return (
    <div>
      <span data-testid="user-id">{userId}</span>
      <button onClick={() => setUserId("alice")}>Set Alice</button>
      <button onClick={() => setUserId("")}>Clear</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("UserContext", () => {
  it("starts with empty userId when localStorage is empty", () => {
    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );
    expect(screen.getByTestId("user-id").textContent).toBe("");
  });

  it("reads initial userId from localStorage", async () => {
    localStorage.setItem("parla-user-id", "bob");

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    // useEffect runs async, so wait for the value to appear
    expect(await screen.findByText("bob")).toBeInTheDocument();
  });

  it("persists userId to localStorage when set", async () => {
    const user = userEvent.setup();

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    await user.click(screen.getByText("Set Alice"));
    expect(screen.getByTestId("user-id").textContent).toBe("alice");
    expect(localStorage.getItem("parla-user-id")).toBe("alice");
  });

  it("removes from localStorage when cleared", async () => {
    localStorage.setItem("parla-user-id", "alice");
    const user = userEvent.setup();

    render(
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    );

    await user.click(screen.getByText("Clear"));
    expect(screen.getByTestId("user-id").textContent).toBe("");
    expect(localStorage.getItem("parla-user-id")).toBeNull();
  });

  it("throws when useUser is called outside provider", () => {
    // Suppress console.error for the expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      "useUser must be used within UserProvider"
    );

    spy.mockRestore();
  });
});
