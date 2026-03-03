"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { getThreads } from "@/lib/api";
import type { Thread } from "@/lib/types";
import { ThreadCard } from "@/components/ThreadCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MessageSquare } from "lucide-react";

export default function MyPostsPage() {
  const { userId } = useUser();
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-[#BF0436] to-[#2D83A6] bg-clip-text text-transparent">
        My Posts
      </h1>

      {!userId ? (
        <div className="text-center py-16">
          <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">
            Enter your User ID in the top bar to see your posts.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="threads" className="w-full">
          <TabsList className="bg-white/80 border border-gray-200">
            <TabsTrigger
              value="threads"
              className="gap-1.5 data-[state=active]:bg-[#fce4ec] data-[state=active]:text-[#BF0436]"
            >
              <MessageSquare className="h-4 w-4" />
              My Threads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="threads" className="mt-4">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">
                  You haven&apos;t created any threads yet.
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
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
