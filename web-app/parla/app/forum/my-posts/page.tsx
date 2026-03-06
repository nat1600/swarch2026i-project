"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0";
import { getThreads } from "@/lib/forum/api";
import type { Thread } from "@/lib/forum/types";
import { ThreadCard } from "@/components/forum/ThreadCard";
import { NavBar } from "@/components/forum/NavBar";
import { ScrollReveal } from "@/components/core/scroll-reveal";
import { User, MessageSquare } from "lucide-react";

export default function MyPostsPage() {
  const { user, isLoading: authLoading } = useUser();
  const userId = user?.sub;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!userId) {
      setThreads([]);
      return;
    }

    setLoading(true);
    getThreads({ user_id: userId, limit: 10 })
      .then((res) => {
        setThreads(res.items);
        setNextCursor(res.next_cursor);
        setHasMore(res.has_more);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleThreadUpdated = useCallback((updated: Thread) => {
    setThreads((prev) =>
      prev.map((t) => (t._id === updated._id ? updated : t))
    );
  }, []);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore || !userId) return;
    setLoadingMore(true);
    try {
      const res = await getThreads({
        user_id: userId,
        limit: 10,
        after: nextCursor,
      });
      setThreads((prev) => [...prev, ...res.items]);
      setNextCursor(res.next_cursor);
      setHasMore(res.has_more);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="font-app min-h-screen w-full bg-polka overflow-x-hidden selection:bg-parla-blue selection:text-white pb-20">
      <NavBar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-10 space-y-10">
        <ScrollReveal>
          <h1 className="font-brand text-[clamp(2rem,5vw,3rem)] text-parla-dark leading-tight flex items-center gap-3">
            <span>📝</span> Mis Hilos
          </h1>
        </ScrollReveal>

        {authLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/50 border-4 border-parla-dark opacity-20 rounded-3xl h-36 animate-pulse"
              />
            ))}
          </div>
        ) : !userId ? (
          <ScrollReveal>
            <div className="bg-white border-4 border-parla-dark rounded-3xl p-16 text-center shadow-[0_8px_0_0_var(--color-parla-dark)]">
              <User
                className="h-16 w-16 mx-auto text-parla-light mb-4"
                strokeWidth={2}
              />
              <p className="text-parla-dark font-extrabold text-xl">
                Inicia sesión para ver tus hilos.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <>
            {/* Threads tab header */}
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 bg-white border-4 border-parla-dark rounded-2xl shadow-[0_4px_0_0_#254159] px-5 py-2.5">
                <MessageSquare
                  className="h-5 w-5 text-parla-red"
                  strokeWidth={2.5}
                />
                <span className="font-black text-sm text-parla-dark">
                  Mis Hilos
                </span>
              </div>
            </ScrollReveal>

            {loading ? (
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/50 border-4 border-parla-dark opacity-20 rounded-3xl h-36 animate-pulse"
                  />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <ScrollReveal>
                <div className="bg-white border-4 border-parla-dark rounded-3xl p-12 text-center shadow-[0_8px_0_0_var(--color-parla-dark)]">
                  <MessageSquare
                    className="h-12 w-12 mx-auto text-parla-light mb-3"
                    strokeWidth={2}
                  />
                  <p className="text-parla-dark font-extrabold text-lg">
                    Aún no has creado ningún hilo.
                  </p>
                </div>
              </ScrollReveal>
            ) : (
              <div className="space-y-6">
                {threads.map((t, i) => (
                  <ScrollReveal
                    key={t._id}
                    animation="animate-fade-in-up"
                    delay={`${(i % 5) * 100}ms`}
                  >
                    <ThreadCard
                      thread={t}
                      onUpdated={handleThreadUpdated}
                    />
                  </ScrollReveal>
                ))}

                {hasMore && (
                  <div className="pt-8 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="btn-primary w-full sm:w-auto"
                    >
                      {loadingMore ? "Cargando..." : "Cargar más"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
