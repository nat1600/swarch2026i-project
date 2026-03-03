"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { searchThreads } from "@/lib/api";
import type { Thread } from "@/lib/types";
import { ThreadCard } from "@/components/ThreadCard";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#BF0436] to-[#2D83A6] bg-clip-text text-transparent">
          Search Results
        </h1>
        {query && (
          <p className="text-gray-500 text-sm mt-1">
            Showing results for &quot;{query}&quot;
          </p>
        )}
      </div>

      {/* Results */}
      {!query.trim() ? (
        <div className="text-center py-16">
          <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Enter a search query to find threads.</p>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">
            No threads found for &quot;{query}&quot;.
          </p>
        </div>
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
              {loadingMore ? "Loading..." : "Load more results"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
