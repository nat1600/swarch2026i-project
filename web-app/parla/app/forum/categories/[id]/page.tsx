"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getCategory, getThreads } from "@/lib/forum/api";
import type { Category, Thread } from "@/lib/forum/types";
import { ThreadCard } from "@/components/forum/ThreadCard";
import { TagBadge } from "@/components/forum/TagBadge";
import { NavBar } from "@/components/forum/NavBar";
import { ScrollReveal } from "@/components/core/scroll-reveal";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTag = searchParams.get("tag") || "";

  const [category, setCategory] = useState<Category | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  const categoryId = params.id;

  // Fetch category
  useEffect(() => {
    getCategory(categoryId)
      .then(setCategory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryId]);

  // Fetch threads (re-fetch when tag changes)
  useEffect(() => {
    setLoadingThreads(true);
    const fetchParams: { category_id: string; tag?: string; limit: number } = {
      category_id: categoryId,
      limit: 10,
    };
    if (activeTag) fetchParams.tag = activeTag;

    getThreads(fetchParams)
      .then((res) => {
        setThreads(res.items);
        setNextCursor(res.next_cursor);
        setHasMore(res.has_more);

        const tags = new Set<string>();
        res.items.forEach((t) => t.tags.forEach((tag) => tags.add(tag)));
        setAllTags((prev) => {
          const merged = new Set([...prev, ...tags]);
          return Array.from(merged);
        });
      })
      .catch(console.error)
      .finally(() => setLoadingThreads(false));
  }, [categoryId, activeTag]);

  const handleThreadUpdated = useCallback((updated: Thread) => {
    setThreads((prev) =>
      prev.map((t) => (t._id === updated._id ? updated : t))
    );
  }, []);

  const handleTagClick = (tag: string) => {
    if (tag === activeTag) {
      router.push(`/forum/categories/${categoryId}`);
    } else {
      router.push(
        `/forum/categories/${categoryId}?tag=${encodeURIComponent(tag)}`
      );
    }
  };

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const fetchParams: {
        category_id: string;
        tag?: string;
        limit: number;
        after: string;
      } = { category_id: categoryId, limit: 10, after: nextCursor };
      if (activeTag) fetchParams.tag = activeTag;

      const res = await getThreads(fetchParams);
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
        {/* Back link + header */}
        <div>
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 font-black text-sm text-parla-blue hover:text-parla-red transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            Volver al foro
          </Link>

          {loading ? (
            <div className="bg-white/50 border-4 border-parla-dark opacity-20 rounded-3xl h-16 animate-pulse" />
          ) : category ? (
            <ScrollReveal>
              <div>
                <h1 className="font-brand text-[clamp(2rem,5vw,3rem)] text-parla-dark leading-tight">
                  {category.name}
                </h1>
                <p className="text-parla-blue font-semibold mt-2">
                  {category.description}
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="bg-white border-4 border-parla-dark rounded-3xl p-8 text-center shadow-[0_8px_0_0_var(--color-parla-dark)]">
              <p className="text-parla-red font-extrabold text-xl">
                Categoría no encontrada.
              </p>
            </div>
          )}
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <ScrollReveal>
            <div className="flex flex-wrap items-center gap-3 bg-white border-4 border-parla-dark rounded-3xl shadow-[0_6px_0_0_#254159] p-4">
              <span className="text-xs font-black text-parla-dark uppercase tracking-wider">
                Filtrar por tag:
              </span>
              {allTags.map((tag) => (
                <div key={tag} className="relative">
                  <TagBadge tag={tag} onClick={handleTagClick} />
                  {tag === activeTag && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-parla-red ring-2 ring-white border-2 border-parla-dark" />
                  )}
                </div>
              ))}
              {activeTag && (
                <button
                  className="inline-flex items-center gap-1 rounded-2xl px-3 py-1 text-xs font-black text-parla-red border-2 border-parla-light hover:bg-red-50 hover:border-parla-red transition-all"
                  onClick={() =>
                    router.push(`/forum/categories/${categoryId}`)
                  }
                >
                  <X className="h-3 w-3" strokeWidth={3} />
                  Limpiar
                </button>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Threads list */}
        {loadingThreads ? (
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
              <span className="text-5xl mb-3 block">📭</span>
              <p className="text-parla-dark font-extrabold text-lg">
                {activeTag
                  ? `No hay hilos con el tag "${activeTag}".`
                  : "Aún no hay hilos en esta categoría."}
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
                  onTagClick={handleTagClick}
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
                  {loadingMore ? "Cargando..." : "Cargar más hilos"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
