import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

// We test the api module by mocking axios at the transport level
vi.mock("axios", () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Must import after mock
const mockInstance = (axios.create as ReturnType<typeof vi.fn>)();

import {
  getCategories,
  getCategory,
  createCategory,
  getThreads,
  searchThreads,
  getThread,
  createThread,
  updateThread,
  deleteThread,
  likeThread,
  unlikeThread,
  getReplies,
  createReply,
  updateReply,
  deleteReply,
  likeReply,
  unlikeReply,
} from "@/lib/api";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Categories ──────────────────────────────────────────────

describe("getCategories", () => {
  it("calls GET /categories and returns data", async () => {
    const cats = [{ _id: "1", name: "General", description: "d", created_at: "" }];
    mockInstance.get.mockResolvedValueOnce({ data: cats });

    const result = await getCategories();
    expect(mockInstance.get).toHaveBeenCalledWith("/categories");
    expect(result).toEqual(cats);
  });
});

describe("getCategory", () => {
  it("calls GET /categories/:id", async () => {
    const cat = { _id: "abc", name: "Test", description: "d", created_at: "" };
    mockInstance.get.mockResolvedValueOnce({ data: cat });

    const result = await getCategory("abc");
    expect(mockInstance.get).toHaveBeenCalledWith("/categories/abc");
    expect(result).toEqual(cat);
  });
});

describe("createCategory", () => {
  it("calls POST /categories with name and description", async () => {
    const cat = { _id: "new", name: "New", description: "Desc", created_at: "" };
    mockInstance.post.mockResolvedValueOnce({ data: cat });

    const result = await createCategory("New", "Desc");
    expect(mockInstance.post).toHaveBeenCalledWith("/categories", {
      name: "New",
      description: "Desc",
    });
    expect(result).toEqual(cat);
  });
});

// ── Threads ─────────────────────────────────────────────────

describe("getThreads", () => {
  it("calls GET /threads with params", async () => {
    const response = { items: [], next_cursor: null, has_more: false };
    mockInstance.get.mockResolvedValueOnce({ data: response });

    const result = await getThreads({ category_id: "c1", limit: 10 });
    expect(mockInstance.get).toHaveBeenCalledWith("/threads", {
      params: { category_id: "c1", limit: 10 },
    });
    expect(result).toEqual(response);
  });

  it("calls GET /threads without params", async () => {
    const response = { items: [], next_cursor: null, has_more: false };
    mockInstance.get.mockResolvedValueOnce({ data: response });

    await getThreads();
    expect(mockInstance.get).toHaveBeenCalledWith("/threads", {
      params: undefined,
    });
  });
});

describe("searchThreads", () => {
  it("calls GET /threads/search with query", async () => {
    const response = { items: [], next_cursor: null, has_more: false };
    mockInstance.get.mockResolvedValueOnce({ data: response });

    await searchThreads({ q: "hello", limit: 5 });
    expect(mockInstance.get).toHaveBeenCalledWith("/threads/search", {
      params: { q: "hello", limit: 5 },
    });
  });
});

describe("getThread", () => {
  it("calls GET /threads/:id", async () => {
    const thread = { _id: "t1", title: "Test" };
    mockInstance.get.mockResolvedValueOnce({ data: thread });

    const result = await getThread("t1");
    expect(mockInstance.get).toHaveBeenCalledWith("/threads/t1");
    expect(result).toEqual(thread);
  });
});

describe("createThread", () => {
  it("calls POST /threads with payload", async () => {
    const payload = { category_id: "c1", title: "T", content: "C", tags: ["a"] };
    const thread = { _id: "t1", ...payload };
    mockInstance.post.mockResolvedValueOnce({ data: thread });

    const result = await createThread(payload);
    expect(mockInstance.post).toHaveBeenCalledWith("/threads", payload);
    expect(result).toEqual(thread);
  });
});

describe("updateThread", () => {
  it("calls PATCH /threads/:id with payload", async () => {
    const payload = { title: "Updated" };
    const thread = { _id: "t1", title: "Updated" };
    mockInstance.patch.mockResolvedValueOnce({ data: thread });

    const result = await updateThread("t1", payload);
    expect(mockInstance.patch).toHaveBeenCalledWith("/threads/t1", payload);
    expect(result).toEqual(thread);
  });
});

describe("deleteThread", () => {
  it("calls DELETE /threads/:id", async () => {
    mockInstance.delete.mockResolvedValueOnce({});

    await deleteThread("t1");
    expect(mockInstance.delete).toHaveBeenCalledWith("/threads/t1");
  });
});

describe("likeThread", () => {
  it("calls POST /threads/:id/like", async () => {
    const thread = { _id: "t1", likes_count: 1 };
    mockInstance.post.mockResolvedValueOnce({ data: thread });

    const result = await likeThread("t1");
    expect(mockInstance.post).toHaveBeenCalledWith("/threads/t1/like");
    expect(result).toEqual(thread);
  });
});

describe("unlikeThread", () => {
  it("calls DELETE /threads/:id/like", async () => {
    const thread = { _id: "t1", likes_count: 0 };
    mockInstance.delete.mockResolvedValueOnce({ data: thread });

    const result = await unlikeThread("t1");
    expect(mockInstance.delete).toHaveBeenCalledWith("/threads/t1/like");
    expect(result).toEqual(thread);
  });
});

// ── Replies ─────────────────────────────────────────────────

describe("getReplies", () => {
  it("calls GET /threads/:id/replies with params", async () => {
    const response = { items: [], next_cursor: null, has_more: false };
    mockInstance.get.mockResolvedValueOnce({ data: response });

    await getReplies("t1", { limit: 50 });
    expect(mockInstance.get).toHaveBeenCalledWith("/threads/t1/replies", {
      params: { limit: 50 },
    });
  });
});

describe("createReply", () => {
  it("calls POST /threads/:id/replies with payload", async () => {
    const payload = { content: "hello", parent_reply_id: null };
    const reply = { _id: "r1", ...payload };
    mockInstance.post.mockResolvedValueOnce({ data: reply });

    const result = await createReply("t1", payload);
    expect(mockInstance.post).toHaveBeenCalledWith("/threads/t1/replies", payload);
    expect(result).toEqual(reply);
  });
});

describe("updateReply", () => {
  it("calls PATCH /replies/:id", async () => {
    const payload = { content: "updated" };
    const reply = { _id: "r1", content: "updated" };
    mockInstance.patch.mockResolvedValueOnce({ data: reply });

    const result = await updateReply("r1", payload);
    expect(mockInstance.patch).toHaveBeenCalledWith("/replies/r1", payload);
    expect(result).toEqual(reply);
  });
});

describe("deleteReply", () => {
  it("calls DELETE /replies/:id", async () => {
    mockInstance.delete.mockResolvedValueOnce({});

    await deleteReply("r1");
    expect(mockInstance.delete).toHaveBeenCalledWith("/replies/r1");
  });
});

describe("likeReply", () => {
  it("calls POST /replies/:id/like", async () => {
    const reply = { _id: "r1", likes_count: 1 };
    mockInstance.post.mockResolvedValueOnce({ data: reply });

    const result = await likeReply("r1");
    expect(mockInstance.post).toHaveBeenCalledWith("/replies/r1/like");
    expect(result).toEqual(reply);
  });
});

describe("unlikeReply", () => {
  it("calls DELETE /replies/:id/like", async () => {
    const reply = { _id: "r1", likes_count: 0 };
    mockInstance.delete.mockResolvedValueOnce({ data: reply });

    const result = await unlikeReply("r1");
    expect(mockInstance.delete).toHaveBeenCalledWith("/replies/r1/like");
    expect(result).toEqual(reply);
  });
});
