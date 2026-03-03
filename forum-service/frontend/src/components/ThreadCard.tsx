"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { TagBadge } from "@/components/TagBadge";
import { LikeButton } from "@/components/LikeButton";
import { likeThread, unlikeThread } from "@/lib/api";
import type { Thread } from "@/lib/types";
import { MessageCircle, Clock, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

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

interface ThreadCardProps {
  thread: Thread;
  onUpdated?: (thread: Thread) => void;
  onTagClick?: (tag: string) => void;
}

export function ThreadCard({ thread, onUpdated, onTagClick }: ThreadCardProps) {
  const router = useRouter();

  return (
    <Link href={`/threads/${thread._id}`}>
      <Card className="group hover:shadow-md hover:border-[#A9CBD9] transition-all duration-200 bg-white/80 backdrop-blur-sm p-4 cursor-pointer">
        <div className="flex flex-col gap-2">
          {/* Header: title + edited badge */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-800 group-hover:text-[#BF0436] transition-colors line-clamp-1">
              {thread.title}
            </h3>
            {thread.updated_at && (
              <span className="shrink-0 inline-flex items-center gap-1 text-xs text-[#2D83A6] bg-[#d1ecf1] rounded-full px-2 py-0.5">
                <Pencil className="h-3 w-3" />
                edited
              </span>
            )}
          </div>

          {/* Content preview */}
          <p className="text-sm text-gray-500 line-clamp-2">{thread.content}</p>

          {/* Tags */}
          {thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {thread.tags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  onClick={(t) => {
                    if (onTagClick) onTagClick(t);
                    else router.push(`/categories/${thread.category_id}?tag=${encodeURIComponent(t)}`);
                  }}
                />
              ))}
            </div>
          )}

          {/* Footer: meta info */}
          <div className="flex items-center gap-4 pt-1">
            <LikeButton
              likes={thread.likes}
              likesCount={thread.likes_count}
              onLike={async () => {
                const updated = await likeThread(thread._id);
                onUpdated?.(updated);
              }}
              onUnlike={async () => {
                const updated = await unlikeThread(thread._id);
                onUpdated?.(updated);
              }}
            />

            <div className="flex items-center gap-1 text-sm text-gray-400">
              <MessageCircle className="h-4 w-4" />
              <span className="tabular-nums">{thread.replies_count}</span>
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeAgo(thread.created_at)}</span>
            </div>

            <span className="text-xs text-gray-400 font-mono">
              {thread.user_id}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
