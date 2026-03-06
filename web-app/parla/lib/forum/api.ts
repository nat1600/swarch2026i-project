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

/** Build Axios request config with the X-User-Id header when a userId is provided. */
function authHeaders(userId?: string) {
  return userId ? { headers: { "X-User-Id": userId } } : {};
}

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
  description: string,
  userId?: string
): Promise<Category> {
  const { data } = await api.post<Category>(
    "/categories",
    { name, description },
    authHeaders(userId)
  );
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
  payload: ThreadCreatePayload,
  userId?: string
): Promise<Thread> {
  const { data } = await api.post<Thread>("/threads", payload, authHeaders(userId));
  return data;
}

export async function updateThread(
  id: string,
  payload: ThreadUpdatePayload,
  userId?: string
): Promise<Thread> {
  const { data } = await api.patch<Thread>(`/threads/${id}`, payload, authHeaders(userId));
  return data;
}

export async function deleteThread(id: string, userId?: string): Promise<void> {
  await api.delete(`/threads/${id}`, authHeaders(userId));
}

export async function likeThread(id: string, userId?: string): Promise<Thread> {
  const { data } = await api.post<Thread>(`/threads/${id}/like`, null, authHeaders(userId));
  return data;
}

export async function unlikeThread(id: string, userId?: string): Promise<Thread> {
  const { data } = await api.delete<Thread>(`/threads/${id}/like`, authHeaders(userId));
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
  payload: ReplyCreatePayload,
  userId?: string
): Promise<Reply> {
  const { data } = await api.post<Reply>(
    `/threads/${threadId}/replies`,
    payload,
    authHeaders(userId)
  );
  return data;
}

export async function updateReply(
  id: string,
  payload: ReplyUpdatePayload,
  userId?: string
): Promise<Reply> {
  const { data } = await api.patch<Reply>(`/replies/${id}`, payload, authHeaders(userId));
  return data;
}

export async function deleteReply(id: string, userId?: string): Promise<void> {
  await api.delete(`/replies/${id}`, authHeaders(userId));
}

export async function likeReply(id: string, userId?: string): Promise<Reply> {
  const { data } = await api.post<Reply>(`/replies/${id}/like`, null, authHeaders(userId));
  return data;
}

export async function unlikeReply(id: string, userId?: string): Promise<Reply> {
  const { data } = await api.delete<Reply>(`/replies/${id}/like`, authHeaders(userId));
  return data;
}

export default api;
