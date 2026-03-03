import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserProvider } from "@/context/UserContext";
import { Navbar } from "@/components/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock SearchBar to isolate Navbar tests
vi.mock("@/components/SearchBar", () => ({
  SearchBar: () => <div data-testid="search-bar">SearchBar</div>,
}));

function renderNavbar() {
  return render(
    <UserProvider>
      <TooltipProvider>
        <Navbar />
      </TooltipProvider>
    </UserProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("Navbar", () => {
  it("renders the Parla logo", () => {
    renderNavbar();
    expect(screen.getByText("Parla")).toBeInTheDocument();
  });

  it("renders the P icon", () => {
    renderNavbar();
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("renders Home and My Posts nav links", () => {
    renderNavbar();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("My Posts")).toBeInTheDocument();
  });

  it("Home link points to /", () => {
    renderNavbar();
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("My Posts link points to /my-posts", () => {
    renderNavbar();
    const myPostsLink = screen.getByText("My Posts").closest("a");
    expect(myPostsLink).toHaveAttribute("href", "/my-posts");
  });

  it("renders the search bar", () => {
    renderNavbar();
    expect(screen.getByTestId("search-bar")).toBeInTheDocument();
  });

  it("renders the user ID input", () => {
    renderNavbar();
    expect(screen.getByPlaceholderText("Your User ID")).toBeInTheDocument();
  });

  it("allows typing a user ID", async () => {
    const user = userEvent.setup();
    renderNavbar();

    const input = screen.getByPlaceholderText("Your User ID");
    await user.type(input, "alice");
    expect(input).toHaveValue("alice");
  });

  it("persists user ID to localStorage on input", async () => {
    const user = userEvent.setup();
    renderNavbar();

    const input = screen.getByPlaceholderText("Your User ID");
    await user.type(input, "bob");
    expect(localStorage.getItem("parla-user-id")).toBe("bob");
  });

  it("loads user ID from localStorage on mount", async () => {
    localStorage.setItem("parla-user-id", "charlie");
    renderNavbar();

    const input = screen.getByPlaceholderText("Your User ID");
    // useEffect is async, wait for value
    await vi.waitFor(() => {
      expect(input).toHaveValue("charlie");
    });
  });
});
