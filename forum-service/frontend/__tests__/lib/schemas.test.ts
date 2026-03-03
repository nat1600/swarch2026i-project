import { describe, it, expect } from "vitest";
import { z } from "zod/v4";
import {
  threadCreateSchema,
  threadUpdateSchema,
  replyCreateSchema,
  replyUpdateSchema,
} from "@/lib/schemas";

// ── threadCreateSchema ──────────────────────────────────────

describe("threadCreateSchema", () => {
  it("accepts valid data with all fields", () => {
    const result = z.safeParse(threadCreateSchema, {
      category_id: "cat-1",
      title: "My Thread",
      content: "Some content here",
      tags: "react, node",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid data without optional tags", () => {
    const result = z.safeParse(threadCreateSchema, {
      category_id: "cat-1",
      title: "My Thread",
      content: "Some content here",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty category_id", () => {
    const result = z.safeParse(threadCreateSchema, {
      category_id: "",
      title: "Title",
      content: "Content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = z.safeParse(threadCreateSchema, {
      category_id: "cat-1",
      title: "",
      content: "Content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 300 chars", () => {
    const result = z.safeParse(threadCreateSchema, {
      category_id: "cat-1",
      title: "a".repeat(301),
      content: "Content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = z.safeParse(threadCreateSchema, {
      category_id: "cat-1",
      title: "Title",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = z.safeParse(threadCreateSchema, {});
    expect(result.success).toBe(false);
  });
});

// ── threadUpdateSchema ──────────────────────────────────────

describe("threadUpdateSchema", () => {
  it("accepts partial update with only title", () => {
    const result = z.safeParse(threadUpdateSchema, { title: "New Title" });
    expect(result.success).toBe(true);
  });

  it("accepts partial update with only content", () => {
    const result = z.safeParse(threadUpdateSchema, { content: "New content" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all fields optional)", () => {
    const result = z.safeParse(threadUpdateSchema, {});
    expect(result.success).toBe(true);
  });

  it("rejects empty title string when provided", () => {
    const result = z.safeParse(threadUpdateSchema, { title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty content string when provided", () => {
    const result = z.safeParse(threadUpdateSchema, { content: "" });
    expect(result.success).toBe(false);
  });
});

// ── replyCreateSchema ───────────────────────────────────────

describe("replyCreateSchema", () => {
  it("accepts valid reply content", () => {
    const result = z.safeParse(replyCreateSchema, { content: "Great post!" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = z.safeParse(replyCreateSchema, { content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing content", () => {
    const result = z.safeParse(replyCreateSchema, {});
    expect(result.success).toBe(false);
  });
});

// ── replyUpdateSchema ───────────────────────────────────────

describe("replyUpdateSchema", () => {
  it("accepts valid update content", () => {
    const result = z.safeParse(replyUpdateSchema, { content: "Edited reply" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = z.safeParse(replyUpdateSchema, { content: "" });
    expect(result.success).toBe(false);
  });
});
