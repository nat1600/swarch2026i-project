"use client";

import { useEffect, useState, useCallback } from "react";
import { getCategories, getThreads } from "@/lib/api";
import type { Category, Thread } from "@/lib/types";
import { CategoryCard } from "@/components/CategoryCard";
import { ThreadComposer } from "@/components/ThreadComposer";
import { ThreadCard } from "@/components/ThreadCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoadingCats(false));

    getThreads({ limit: 10 })
      .then((res) => {
        setThreads(res.items);
        setNextCursor(res.next_cursor);
        setHasMore(res.has_more);
      })
      .catch(console.error)
      .finally(() => setLoadingThreads(false));
  }, []);

  const handleThreadCreated = useCallback((thread: Thread) => {
    setThreads((prev) => [thread, ...prev]);
  }, []);

  const handleThreadUpdated = useCallback((updated: Thread) => {
    setThreads((prev) =>
      prev.map((t) => (t._id === updated._id ? updated : t))
    );
  }, []);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getThreads({ limit: 10, after: nextCursor });
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
      {/* Categories section */}
      <section>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#BF0436] to-[#8C0327] bg-clip-text text-transparent mb-4">
          Categories
        </h2>

        {loadingCats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-gray-500 text-sm">No categories yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <CategoryCard key={cat._id} category={cat} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Thread Composer (inline, Twitter-style) */}
      <section>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#BF0436] to-[#2D83A6] bg-clip-text text-transparent mb-4">
          New Thread
        </h2>
        <ThreadComposer
          categories={categories}
          onCreated={handleThreadCreated}
        />
      </section>

      {/* Recent threads section */}
      <section>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#2D83A6] to-[#254159] bg-clip-text text-transparent mb-4">
          Recent Threads
        </h2>

        {loadingThreads ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No threads yet. Be the first to start a conversation!
          </p>
        ) : (
          <div className="space-y-4">
            {threads.map((t) => (
              <ThreadCard
                key={t._id}
                thread={t}
                onUpdated={handleThreadUpdated}
              />
            ))}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full rounded-lg border border-[#A9CBD9] bg-[#e8f4f8] py-2.5 text-sm font-medium text-[#254159] hover:bg-[#d1ecf1] transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more threads"}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
