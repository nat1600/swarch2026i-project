"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";

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
  const { userId } = useUser();
  const isLiked = userId ? likes.includes(userId) : false;
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const liked = optimisticLiked !== null ? optimisticLiked : isLiked;
  const count = optimisticCount !== null ? optimisticCount : likesCount;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId || loading) return;

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
      // revert on error
      setOptimisticLiked(null);
      setOptimisticCount(null);
    } finally {
      setLoading(false);
      // reset optimistic state — parent should have re-fetched
      setOptimisticLiked(null);
      setOptimisticCount(null);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`gap-1.5 px-2 h-8 text-sm transition-all ${
        liked
          ? "text-[#BF0436] hover:text-[#8C0327] hover:bg-[#fce4ec]"
          : "text-gray-400 hover:text-[#BF0436] hover:bg-[#fce4ec]"
      } ${liked ? "animate-jump animate-once animate-duration-300" : ""}`}
      onClick={handleClick}
      disabled={!userId}
    >
      <Heart
        className={`h-4 w-4 transition-all ${liked ? "fill-current" : ""}`}
      />
      <span className="tabular-nums">{count}</span>
    </Button>
  );
}
