"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0";

interface LikeButtonProps {
  likes: string[];
  likesCount: number;
  onLike: () => Promise<void>;
  onUnlike: () => Promise<void>;
}

export function LikeButton({
  likes,
  likesCount,
  onLike,
  onUnlike,
}: LikeButtonProps) {
  const { user } = useUser();
  const isLiked = user?.sub ? likes.includes(user.sub) : false;
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const liked = optimisticLiked !== null ? optimisticLiked : isLiked;
  const count = optimisticCount !== null ? optimisticCount : likesCount;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.sub || loading) return;

    const wasLiked = liked;
    setOptimisticLiked(!wasLiked);
    setOptimisticCount(count + (wasLiked ? -1 : 1));
    setLoading(true);

    try {
      if (wasLiked) {
        await onUnlike();
      } else {
        await onLike();
      }
    } catch {
      setOptimisticLiked(null);
      setOptimisticCount(null);
    } finally {
      setLoading(false);
      setOptimisticLiked(null);
      setOptimisticCount(null);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!user?.sub || loading}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl font-black text-sm transition-all duration-200
        border-2 border-parla-dark shadow-[0_3px_0_0_var(--color-parla-dark)]
        active:translate-y-0.75 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed
        ${
          liked
            ? "bg-parla-red text-white hover:bg-[#a6032f] animate-jump animate-once"
            : "bg-white text-parla-dark hover:bg-parla-mist"
        }
      `}
    >
      <Heart
        className={`h-4 w-4 transition-transform ${
          liked ? "fill-white scale-110" : "fill-transparent"
        }`}
        strokeWidth={liked ? 0 : 2.5}
      />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}