"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { searchThreads } from "@/lib/forum/api";
import type { Thread } from "@/lib/forum/types";
import { ThreadCard } from "@/components/forum/ThreadCard";
import { NavBar } from "@/components/forum/NavBar";
import { ScrollReveal } from "@/components/core/scroll-reveal";
import { Search } from "lucide-react";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setThreads([]);
      return;
    }

    setLoading(true);
    searchThreads({ q: query, limit: 10 })
      .then((res) => {
        setThreads(res.items);
        setNextCursor(res.next_cursor);
        setHasMore(res.has_more);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  const handleThreadUpdated = useCallback((updated: Thread) => {
    setThreads((prev) =>
      prev.map((t) => (t._id === updated._id ? updated : t))
    );
  }, []);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore || !query.trim()) return;
    setLoadingMore(true);
    try {
      const res = await searchThreads({
        q: query,
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
    <div className="space-y-10">
      {/* Header */}
      <ScrollReveal>
        <div>
          <h1 className="font-brand text-[clamp(2rem,5vw,3rem)] text-parla-dark leading-tight flex items-center gap-3">
            <span>🔍</span> Resultados de búsqueda
          </h1>
          {query && (
            <p className="text-parla-blue font-semibold mt-2">
              Mostrando resultados para &quot;{query}&quot;
            </p>
          )}
        </div>
      </ScrollReveal>

      {/* Results */}
      {!query.trim() ? (
        <ScrollReveal>
          <div className="bg-white border-4 border-parla-dark rounded-3xl p-16 text-center shadow-[0_8px_0_0_var(--color-parla-dark)]">
            <Search
              className="h-16 w-16 mx-auto text-parla-light mb-4"
              strokeWidth={2}
            />
            <p className="text-parla-dark font-extrabold text-xl">
              Escribe algo en la barra de búsqueda para encontrar hilos.
            </p>
          </div>
        </ScrollReveal>
      ) : loading ? (
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
          <div className="bg-white border-4 border-parla-dark rounded-3xl p-16 text-center shadow-[0_8px_0_0_var(--color-parla-dark)]">
            <Search
              className="h-16 w-16 mx-auto text-parla-light mb-4"
              strokeWidth={2}
            />
            <p className="text-parla-dark font-extrabold text-xl">
              No se encontraron hilos para &quot;{query}&quot;.
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
                {loadingMore ? "Cargando..." : "Cargar más resultados"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="font-app min-h-screen w-full bg-polka overflow-x-hidden selection:bg-parla-blue selection:text-white pb-20">
      <NavBar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">
        <Suspense
          fallback={
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/50 border-4 border-parla-dark opacity-20 rounded-3xl h-36 animate-pulse"
                />
              ))}
            </div>
          }
        >
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
