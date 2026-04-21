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
  updateThread,
} from "@/lib/forum/api";
import type { Thread, Reply } from "@/lib/forum/types";
import { useUser } from "@auth0/nextjs-auth0";
import { LikeButton } from "@/components/forum/LikeButton";
import { TagBadge } from "@/components/forum/TagBadge";
import { ReplyCard } from "@/components/forum/ReplyCard";
import { ReplyForm } from "@/components/forum/ReplyForm";
import { NavBar } from "@/components/forum/NavBar";
import { ScrollReveal } from "@/components/core/ScrollReveal";
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
  Send,
} from "lucide-react";
import Link from "next/link";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "ahora mismo";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  return `hace ${months} meses`;
}

export default function ThreadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
    const map = new Map<string, Reply[]>();
    const roots: Reply[] = [];
    replies.forEach((r) => {
      if (r.parent_reply_id) {
        const children = map.get(r.parent_reply_id) || [];
        children.push(r);
        map.set(r.parent_reply_id, children);
      } else {
        roots.push(r);
      }
    });
    return { rootReplies: roots, childrenMap: map };
  }, [replies]);

  const getChildReplies = useCallback(
    (parentId: string): Reply[] => childrenMap.get(parentId) || [],
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
    if (!thread || !user?.sub) return;
    setSaving(true);
    try {
      const updated = await updateThread(
        thread._id,
        {
          title: editTitle,
          content: editContent,
          tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
        },
        
      );
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
    if (!thread || !user?.sub) return;
    try {
      await deleteThread(thread._id, );
      router.push("/forum");
    } catch (err) {
      console.error("Failed to delete thread:", err);
    }
  };

  // Reply edit
  const handleEditReply = async (reply: Reply) => {
    const newContent = prompt("Editar respuesta:", reply.content);
    if (newContent !== null && newContent.trim() && user?.sub) {
      try {
        const updated = await updateReply(
          reply._id,
          { content: newContent.trim() },
          
        );
        handleReplyUpdated(updated);
      } catch (err) {
        console.error("Failed to update reply:", err);
      }
    }
  };

  // Reply delete
  const handleDeleteReply = (reply: Reply) => {
    setConfirmDelete(reply._id);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete || !user?.sub) return;
    if (confirmDelete === "thread") {
      await handleDeleteThread();
    } else {
      try {
        await deleteReply(confirmDelete, );
        setReplies((prev) => prev.filter((r) => r._id !== confirmDelete));
      } catch (err) {
        console.error("Failed to delete reply:", err);
      }
    }
    setConfirmDelete(null);
  };

  const isAuthor = thread && user?.sub === thread.user_id;

  return (
    <div className="font-app min-h-screen w-full bg-polka overflow-x-hidden selection:bg-parla-blue selection:text-white pb-20">
      <NavBar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-10 space-y-10">
        {/* Back link */}
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 font-black text-sm text-parla-blue hover:text-parla-red transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={3} />
          Volver al foro
        </Link>

        {/* Thread detail */}
        {loadingThread ? (
          <div className="space-y-4">
            <div className="bg-white/50 border-4 border-parla-dark opacity-20 rounded-3xl h-12 animate-pulse" />
            <div className="bg-white/50 border-4 border-parla-dark opacity-20 rounded-3xl h-6 w-1/2 animate-pulse" />
            <div className="bg-white/50 border-4 border-parla-dark opacity-20 rounded-3xl h-40 animate-pulse" />
          </div>
        ) : !thread ? (
          <div className="bg-white border-4 border-parla-dark rounded-3xl p-12 text-center shadow-[0_8px_0_0_var(--color-parla-dark)]">
            <p className="text-parla-red font-extrabold text-xl">Hilo no encontrado.</p>
          </div>
        ) : (
          <ScrollReveal>
            <div className="bg-white border-4 border-parla-dark rounded-3xl shadow-[0_8px_0_0_#254159] p-6 sm:p-8 space-y-5">
              {editing ? (
                /* Edit mode */
                <div className="space-y-4">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full h-12 rounded-2xl border-4 border-parla-light bg-parla-mist px-4 text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={5}
                    className="w-full rounded-2xl border-4 border-parla-light bg-parla-mist p-4 text-parla-dark font-bold resize-none focus:outline-none focus:border-parla-blue transition-colors"
                  />
                  <input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Tags (separados por coma)"
                    className="w-full h-12 rounded-2xl border-4 border-parla-light bg-parla-mist px-4 text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="bg-parla-red text-white font-black text-sm py-2 px-6 rounded-2xl border-b-[6px] border-[#8C0327] hover:bg-[#a6032f] active:border-b-0 active:translate-y-1.5 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" strokeWidth={3} />
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="font-extrabold text-parla-blue hover:text-parla-dark px-4 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="font-brand text-[clamp(1.5rem,4vw,2.5rem)] text-parla-dark leading-tight">
                      {thread.title}
                    </h1>
                    {thread.updated_at && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-parla-dark bg-parla-light rounded-full px-3 py-1 border-2 border-parla-dark">
                        <Pencil className="h-3 w-3" />
                        editado
                      </span>
                    )}
                  </div>

                  <p className="text-parla-blue font-semibold text-base whitespace-pre-wrap leading-relaxed">
                    {thread.content}
                  </p>

                  {/* Tags */}
                  {thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {thread.tags.map((tag) => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  )}

                  {/* Meta footer */}
                  <div className="flex items-center gap-5 pt-3 border-t-4 border-parla-mist flex-wrap">
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

                    <div className="flex items-center gap-1.5 text-sm font-extrabold text-parla-blue">
                      <MessageCircle className="h-5 w-5 stroke-[2.5]" />
                      <span className="tabular-nums">{replies.length}</span>
                      <span>respuestas</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-parla-light ml-auto">
                      <User className="h-4 w-4" strokeWidth={2.5} />
                      <span className="bg-parla-mist px-2 py-1 rounded-lg border-2 border-parla-light">
                        @{thread.user_id.substring(0, 8)}...
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-parla-light">
                      <Clock className="h-4 w-4" strokeWidth={2.5} />
                      <span>{timeAgo(thread.created_at)}</span>
                    </div>
                  </div>

                  {/* Author actions */}
                  {isAuthor && (
                    <div className="flex gap-3 pt-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-parla-blue border-2 border-parla-light hover:bg-parla-mist hover:border-parla-blue transition-all"
                        onClick={() => setEditing(true)}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2.5} />
                        Editar
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-parla-red border-2 border-parla-light hover:bg-red-50 hover:border-parla-red transition-all"
                        onClick={() => setConfirmDelete("thread")}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Confirm delete dialog */}
        <Dialog
          open={confirmDelete !== null}
          onOpenChange={(open) => {
            if (!open) setConfirmDelete(null);
          }}
        >
          <DialogContent className="border-4 border-parla-dark rounded-3xl shadow-[0_8px_0_0_#254159]">
            <DialogHeader>
              <DialogTitle className="font-brand text-2xl text-parla-dark">
                Confirmar eliminación
              </DialogTitle>
              <DialogDescription className="font-semibold text-parla-blue">
                {confirmDelete === "thread"
                  ? "¿Estás seguro de que quieres eliminar este hilo? Esta acción no se puede deshacer."
                  : "¿Estás seguro de que quieres eliminar esta respuesta? Esta acción no se puede deshacer."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3">
              <DialogClose asChild>
                <button className="font-extrabold text-parla-blue hover:text-parla-dark px-4 transition-colors">
                  Cancelar
                </button>
              </DialogClose>
              <button
                className="bg-parla-red text-white font-black text-sm py-2 px-6 rounded-2xl border-b-[6px] border-[#8C0327] hover:bg-[#a6032f] active:border-b-0 active:translate-y-1.5 transition-all"
                onClick={confirmDeleteAction}
              >
                Eliminar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Replies section */}
        <section>
          <div className="border-t-4 border-parla-dark mb-8" />

          <ScrollReveal>
            <h2 className="font-brand text-[clamp(1.5rem,4vw,2rem)] text-parla-dark leading-tight mb-6 flex items-center gap-3">
              <span>💬</span> Respuestas
            </h2>
          </ScrollReveal>

          {/* Reply form (top-level) */}
          {thread && (
            <ScrollReveal>
              <div className="mb-8 bg-white border-4 border-parla-dark rounded-3xl shadow-[0_6px_0_0_#254159] p-5">
                <ReplyForm
                  threadId={threadId}
                  onCreated={handleReplyCreated}
                  placeholder="Escribe una respuesta..."
                />
              </div>
            </ScrollReveal>
          )}

          {/* Replies list */}
          {loadingReplies ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white/50 border-4 border-parla-dark opacity-20 rounded-3xl h-24 animate-pulse" />
              ))}
            </div>
          ) : rootReplies.length === 0 ? (
            <ScrollReveal>
              <div className="bg-white border-4 border-parla-dark rounded-3xl p-12 text-center shadow-[0_6px_0_0_var(--color-parla-dark)]">
                <span className="text-5xl mb-3 block">🦗</span>
                <p className="text-parla-dark font-extrabold text-lg">
                  Aún no hay respuestas. ¡Sé el primero en responder!
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="space-y-4">
              {rootReplies.map((reply, i) => (
                <ScrollReveal
                  key={reply._id}
                  animation="animate-fade-in-up"
                  delay={`${(i % 5) * 80}ms`}
                >
                  <div className="bg-white border-4 border-parla-dark rounded-3xl shadow-[0_6px_0_0_#254159] p-5">
                    <ReplyCard
                      reply={reply}
                      threadId={threadId}
                      depth={0}
                      childReplies={getChildReplies(reply._id)}
                      onReplyCreated={handleReplyCreated}
                      onReplyUpdated={handleReplyUpdated}
                      onEdit={handleEditReply}
                      onDelete={handleDeleteReply}
                    />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="pt-8 flex justify-center">
              <button
                onClick={handleLoadMoreReplies}
                disabled={loadingMore}
                className="btn-primary w-full sm:w-auto"
              >
                {loadingMore ? "Cargando..." : "Cargar más respuestas"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
