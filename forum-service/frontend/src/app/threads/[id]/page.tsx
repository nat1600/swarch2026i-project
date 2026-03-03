"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getThread,
  getReplies,
  likeThread,
  unlikeThread,
  deleteThread,
  deleteReply,
  updateReply,
} from "@/lib/api";
import type { Thread, Reply } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import { LikeButton } from "@/components/LikeButton";
import { TagBadge } from "@/components/TagBadge";
import { ReplyCard } from "@/components/ReplyCard";
import { ReplyForm } from "@/components/ReplyForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MessageCircle,
  Clock,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ThreadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useUser();
  const threadId = params.id;

  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingThread, setLoadingThread] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // "thread" | reply_id | null

  // Fetch thread
  useEffect(() => {
    getThread(threadId)
      .then((t) => {
        setThread(t);
        setEditTitle(t.title);
        setEditContent(t.content);
        setEditTags(t.tags.join(", "));
      })
      .catch(console.error)
      .finally(() => setLoadingThread(false));
  }, [threadId]);

  // Fetch replies
  useEffect(() => {
    getReplies(threadId, { limit: 50 })
      .then((res) => {
        setReplies(res.items);
        setNextCursor(res.next_cursor);
        setHasMore(res.has_more);
      })
      .catch(console.error)
      .finally(() => setLoadingReplies(false));
  }, [threadId]);

  // Build nested reply tree
  const { rootReplies, childrenMap } = useMemo(() => {
    const childrenMap = new Map<string, Reply[]>();
    const rootReplies: Reply[] = [];

    replies.forEach((r) => {
      if (r.parent_reply_id) {
        const children = childrenMap.get(r.parent_reply_id) || [];
        children.push(r);
        childrenMap.set(r.parent_reply_id, children);
      } else {
        rootReplies.push(r);
      }
    });

    return { rootReplies, childrenMap };
  }, [replies]);

  // Get all children recursively for a reply
  const getChildReplies = useCallback(
    (parentId: string): Reply[] => {
      return childrenMap.get(parentId) || [];
    },
    [childrenMap]
  );

  const handleReplyCreated = useCallback((reply: Reply) => {
    setReplies((prev) => [...prev, reply]);
  }, []);

  const handleReplyUpdated = useCallback((updated: Reply) => {
    setReplies((prev) =>
      prev.map((r) => (r._id === updated._id ? updated : r))
    );
  }, []);

  const handleLoadMoreReplies = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getReplies(threadId, { limit: 50, after: nextCursor });
      setReplies((prev) => [...prev, ...res.items]);
      setNextCursor(res.next_cursor);
      setHasMore(res.has_more);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Thread edit
  const handleSaveEdit = async () => {
    if (!thread) return;
    setSaving(true);
    try {
      const { updateThread } = await import("@/lib/api");
      const updated = await updateThread(thread._id, {
        title: editTitle,
        content: editContent,
        tags: editTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setThread(updated);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update thread:", err);
    } finally {
      setSaving(false);
    }
  };

  // Thread delete
  const handleDeleteThread = async () => {
    if (!thread) return;
    try {
      await deleteThread(thread._id);
      router.push("/");
    } catch (err) {
      console.error("Failed to delete thread:", err);
    }
  };

  // Reply edit (inline)
  const handleEditReply = async (reply: Reply) => {
    const newContent = prompt("Edit reply:", reply.content);
    if (newContent !== null && newContent.trim()) {
      try {
        const updated = await updateReply(reply._id, {
          content: newContent.trim(),
        });
        handleReplyUpdated(updated);
      } catch (err) {
        console.error("Failed to update reply:", err);
      }
    }
  };

  // Reply delete
  const handleDeleteReply = async (reply: Reply) => {
    setConfirmDelete(reply._id);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    if (confirmDelete === "thread") {
      await handleDeleteThread();
    } else {
      try {
        await deleteReply(confirmDelete);
        setReplies((prev) => prev.filter((r) => r._id !== confirmDelete));
      } catch (err) {
        console.error("Failed to delete reply:", err);
      }
    }
    setConfirmDelete(null);
  };

  const isAuthor = thread && userId === thread.user_id;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#BF0436] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      {/* Thread detail */}
      {loadingThread ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : !thread ? (
        <p className="text-[#BF0436]">Thread not found.</p>
      ) : (
        <Card className="bg-white/90 backdrop-blur-sm p-6 border-[#A9CBD9]/40">
          {editing ? (
            /* Edit mode */
            <div className="space-y-3">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-xl font-bold border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2D83A6]"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[#2D83A6]"
              />
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A9CBD9]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="bg-gradient-to-r from-[#BF0436] to-[#8C0327] text-white"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-gray-800">
                  {thread.title}
                </h1>
                {thread.updated_at && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs text-[#2D83A6] bg-[#d1ecf1] rounded-full px-2 py-0.5">
                    <Pencil className="h-3 w-3" />
                    edited
                  </span>
                )}
              </div>

              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {thread.content}
              </p>

              {/* Tags */}
              {thread.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {thread.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>
              )}

              {/* Meta footer */}
              <div className="flex items-center gap-4 pt-2">
                <LikeButton
                  likes={thread.likes}
                  likesCount={thread.likes_count}
                  onLike={async () => {
                    const updated = await likeThread(thread._id);
                    setThread(updated);
                  }}
                  onUnlike={async () => {
                    const updated = await unlikeThread(thread._id);
                    setThread(updated);
                  }}
                />

                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <MessageCircle className="h-4 w-4" />
                  <span className="tabular-nums">{replies.length}</span>
                  <span>replies</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                  <User className="h-3.5 w-3.5" />
                  <span className="font-mono">{thread.user_id}</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{timeAgo(thread.created_at)}</span>
                </div>
              </div>

              {/* Author actions */}
              {isAuthor && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[#2D83A6] border-[#A9CBD9] hover:bg-[#d1ecf1] gap-1.5"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[#BF0436] border-[#fce4ec] hover:bg-[#fce4ec] gap-1.5"
                    onClick={() => setConfirmDelete("thread")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Confirm delete dialog */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
            <DialogDescription>
              {confirmDelete === "thread"
                ? "Are you sure you want to delete this thread? This action cannot be undone."
                : "Are you sure you want to delete this reply? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              className="bg-[#BF0436] hover:bg-[#8C0327] text-white"
              onClick={confirmDeleteAction}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replies section */}
      <section>
        <Separator className="mb-6" />
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Replies</h2>

        {/* Reply form (top-level) */}
        {thread && (
          <div className="mb-6">
            <ReplyForm
              threadId={threadId}
              onCreated={handleReplyCreated}
              placeholder="Write a reply..."
            />
          </div>
        )}

        {/* Replies list */}
        {loadingReplies ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : rootReplies.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            No replies yet. Be the first to reply!
          </p>
        ) : (
          <div className="space-y-1 divide-y divide-gray-100">
            {rootReplies.map((reply) => (
              <ReplyCard
                key={reply._id}
                reply={reply}
                threadId={threadId}
                depth={0}
                childReplies={getChildReplies(reply._id)}
                onReplyCreated={handleReplyCreated}
                onReplyUpdated={handleReplyUpdated}
                onEdit={handleEditReply}
                onDelete={handleDeleteReply}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <button
            onClick={handleLoadMoreReplies}
            disabled={loadingMore}
            className="mt-4 w-full rounded-lg border border-[#A9CBD9] bg-[#e8f4f8] py-2.5 text-sm font-medium text-[#254159] hover:bg-[#d1ecf1] transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more replies"}
          </button>
        )}
      </section>
    </div>
  );
}
