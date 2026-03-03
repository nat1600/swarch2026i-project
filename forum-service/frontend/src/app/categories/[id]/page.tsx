"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getCategory, getThreads } from "@/lib/api";
import type { Category, Thread } from "@/lib/types";
import { ThreadCard } from "@/components/ThreadCard";
import { TagBadge } from "@/components/TagBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

        // Collect unique tags from all threads
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
      router.push(`/categories/${categoryId}`);
    } else {
      router.push(`/categories/${categoryId}?tag=${encodeURIComponent(tag)}`);
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
      } = {
        category_id: categoryId,
        limit: 10,
        after: nextCursor,
      };
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
    <div className="space-y-6">
      {/* Back link + header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#BF0436] transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {loading ? (
          <Skeleton className="h-10 w-64 rounded-lg" />
        ) : category ? (
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#BF0436] to-[#2D83A6] bg-clip-text text-transparent">
              {category.name}
            </h1>
            <p className="text-gray-500 mt-1">{category.description}</p>
          </div>
        ) : (
          <p className="text-[#BF0436]">Category not found.</p>
        )}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Filter by tag:
          </span>
          {allTags.map((tag) => (
            <div key={tag} className="relative">
              <TagBadge tag={tag} onClick={handleTagClick} />
              {tag === activeTag && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#BF0436] ring-2 ring-white" />
              )}
            </div>
          ))}
          {activeTag && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-gray-400 hover:text-gray-600"
              onClick={() => router.push(`/categories/${categoryId}`)}
            >
              <X className="h-3 w-3 mr-1" />
              Clear filter
            </Button>
          )}
        </div>
      )}

      {/* Threads list */}
      {loadingThreads ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">
            {activeTag
              ? `No threads found with tag "${activeTag}".`
              : "No threads in this category yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((t) => (
            <ThreadCard
              key={t._id}
              thread={t}
              onUpdated={handleThreadUpdated}
              onTagClick={handleTagClick}
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
    </div>
  );
}
