"use client";

import Link from "next/link";
import { TagBadge } from "@/components/forum/TagBadge";
import { LikeButton } from "@/components/forum/LikeButton";
import { likeThread, unlikeThread } from "@/lib/forum/api";
import type { Thread } from "@/lib/forum/types";
import { MessageCircle, Clock, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0";

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
  return `hace ${months}meses`;
}

interface ThreadCardProps {
  thread: Thread;
  onUpdated?: (thread: Thread) => void;
  onTagClick?: (tag: string) => void;
}

export function ThreadCard({ thread, onUpdated, onTagClick }: ThreadCardProps) {
  const router = useRouter();
  const { user } = useUser();

  return (
    <Link href={`/forum/threads/${thread._id}`} className="block group">
      <div className="bg-white border-4 border-parla-dark shadow-[0_6px_0_0_#254159] rounded-3xl p-5 hover:-translate-y-1 hover:shadow-[0_8px_0_0_#254159] transition-all duration-200 cursor-pointer">
        <div className="flex flex-col gap-3">
          
          {/* Header: title + edited badge */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-brand text-2xl text-parla-dark group-hover:text-parla-red transition-colors line-clamp-2 leading-tight">
              {thread.title}
            </h3>
            {thread.updated_at && (
              <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-parla-dark bg-parla-light rounded-full px-3 py-1 border-2 border-parla-dark">
                <Pencil className="h-3 w-3" />
                editado
              </span>
            )}
          </div>

          {/* Content preview */}
          <p className="text-parla-blue font-semibold text-base line-clamp-2">
            {thread.content}
          </p>

          {/* Tags (Si TagBadge es un componente tuyo, asegúrate de que también use border-2 y font-bold) */}
          {thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {thread.tags.map((tag) => (
                <div key={tag} onClick={(e) => e.preventDefault()}>
                  <TagBadge
                    tag={tag}
                    onClick={(t) => {
                      if (onTagClick) onTagClick(t);
                      else router.push(`/forum/categories/${thread.category_id}?tag=${encodeURIComponent(t)}`);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Footer: meta info */}
          <div className="flex items-center gap-5 pt-3 mt-1 border-t-4 border-[#F8FAFC]">
            
            {/* Aquí asumo que tu LikeButton maneja su propio render, pero si puedes, 
                añádele un text-parla-red font-black para que encaje */}
            <div onClick={(e) => e.preventDefault()}>
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
            </div>

            <div className="flex items-center gap-1.5 text-sm font-extrabold text-parla-blue">
              <MessageCircle className="h-5 w-5 stroke-[2.5]" />
              <span className="tabular-nums">{thread.replies_count}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-parla-light ml-auto">
              <Clock className="h-4 w-4 stroke-[2.5]" />
              <span>{timeAgo(thread.created_at)}</span>
            </div>

            <span className="text-xs font-bold text-parla-light bg-[#F8FAFC] px-2 py-1 rounded-lg border-2 border-parla-light">
              {/* Mostramos solo los primeros caracteres del ID para que no rompa el diseño */}
              @{thread.user_id.substring(0, 8)}...
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}