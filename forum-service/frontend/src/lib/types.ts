// ── API response types (mirror the FastAPI schemas) ─────────

export interface Category {
  _id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Thread {
  _id: string;
  category_id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  likes: string[];
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface Reply {
  _id: string;
  thread_id: string;
  user_id: string;
  content: string;
  parent_reply_id: string | null;
  likes: string[];
  likes_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

// ── Request types ───────────────────────────────────────────

export interface ThreadCreatePayload {
  category_id: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface ThreadUpdatePayload {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface ReplyCreatePayload {
  content: string;
  parent_reply_id?: string | null;
}

export interface ReplyUpdatePayload {
  content: string;
}
