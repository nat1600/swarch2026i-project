import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryCard } from "@/components/CategoryCard";
import type { Category } from "@/lib/types";

const mockCategory: Category = {
  _id: "cat-1",
  name: "Grammar",
  description: "Discuss grammar rules and questions",
  created_at: "2025-01-01T00:00:00Z",
};

describe("CategoryCard", () => {
  it("renders category name", () => {
    render(<CategoryCard category={mockCategory} index={0} />);
    expect(screen.getByText("Grammar")).toBeInTheDocument();
  });

  it("renders category description", () => {
    render(<CategoryCard category={mockCategory} index={0} />);
    expect(
      screen.getByText("Discuss grammar rules and questions")
    ).toBeInTheDocument();
  });

  it("links to the correct category page", () => {
    render(<CategoryCard category={mockCategory} index={0} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/categories/cat-1");
  });

  it("applies the correct accent color based on index", () => {
    const { container } = render(
      <CategoryCard category={mockCategory} index={1} />
    );
    // index 1 -> "border-l-violet-500"
    const card = container.querySelector("[class*='border-l-']");
    expect(card).toBeTruthy();
    expect(card?.className).toContain("border-l-violet-500");
  });

  it("cycles colors when index exceeds palette length", () => {
    const { container } = render(
      <CategoryCard category={mockCategory} index={8} />
    );
    // index 8 % 8 = 0 -> "border-l-emerald-500"
    const card = container.querySelector("[class*='border-l-']");
    expect(card?.className).toContain("border-l-emerald-500");
  });
});
