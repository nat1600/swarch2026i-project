import axios from "axios";
import type {
  Category,
  Thread,
  Reply,
  CursorPaginatedResponse,
  ThreadCreatePayload,
  ThreadUpdatePayload,
  ReplyCreatePayload,
  ReplyUpdatePayload,
} from "./types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003",
});

// Interceptor: inject X-User-Id on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("parla-user-id");
    if (userId) {
      config.headers["X-User-Id"] = userId;
    }
  }
  return config;
});

// ── Categories ──────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function getCategory(id: string): Promise<Category> {
  const { data } = await api.get<Category>(`/categories/${id}`);
  return data;
}

export async function createCategory(
  name: string,
  description: string
): Promise<Category> {
  const { data } = await api.post<Category>("/categories", {
    name,
    description,
  });
  return data;
}

// ── Threads ─────────────────────────────────────────────────

export async function getThreads(params?: {
  category_id?: string;
  tag?: string;
  user_id?: string;
  after?: string;
  limit?: number;
}): Promise<CursorPaginatedResponse<Thread>> {
  const { data } = await api.get<CursorPaginatedResponse<Thread>>("/threads", {
    params,
  });
  return data;
}

export async function searchThreads(params: {
  q: string;
  after?: string;
  limit?: number;
}): Promise<CursorPaginatedResponse<Thread>> {
  const { data } = await api.get<CursorPaginatedResponse<Thread>>(
    "/threads/search",
    { params }
  );
  return data;
}

export async function getThread(id: string): Promise<Thread> {
  const { data } = await api.get<Thread>(`/threads/${id}`);
  return data;
}

export async function createThread(
  payload: ThreadCreatePayload
): Promise<Thread> {
  const { data } = await api.post<Thread>("/threads", payload);
  return data;
}

export async function updateThread(
  id: string,
  payload: ThreadUpdatePayload
): Promise<Thread> {
  const { data } = await api.patch<Thread>(`/threads/${id}`, payload);
  return data;
}

export async function deleteThread(id: string): Promise<void> {
  await api.delete(`/threads/${id}`);
}

export async function likeThread(id: string): Promise<Thread> {
  const { data } = await api.post<Thread>(`/threads/${id}/like`);
  return data;
}

export async function unlikeThread(id: string): Promise<Thread> {
  const { data } = await api.delete<Thread>(`/threads/${id}/like`);
  return data;
}

// ── Replies ─────────────────────────────────────────────────

export async function getReplies(
  threadId: string,
  params?: { after?: string; limit?: number }
): Promise<CursorPaginatedResponse<Reply>> {
  const { data } = await api.get<CursorPaginatedResponse<Reply>>(
    `/threads/${threadId}/replies`,
    { params }
  );
  return data;
}

export async function createReply(
  threadId: string,
  payload: ReplyCreatePayload
): Promise<Reply> {
  const { data } = await api.post<Reply>(
    `/threads/${threadId}/replies`,
    payload
  );
  return data;
}

export async function updateReply(
  id: string,
  payload: ReplyUpdatePayload
): Promise<Reply> {
  const { data } = await api.patch<Reply>(`/replies/${id}`, payload);
  return data;
}

export async function deleteReply(id: string): Promise<void> {
  await api.delete(`/replies/${id}`);
}

export async function likeReply(id: string): Promise<Reply> {
  const { data } = await api.post<Reply>(`/replies/${id}/like`);
  return data;
}

export async function unlikeReply(id: string): Promise<Reply> {
  const { data } = await api.delete<Reply>(`/replies/${id}/like`);
  return data;
}

export default api;
