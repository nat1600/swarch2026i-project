"use client";

import { Badge } from "@/components/ui/badge";

const TAG_COLORS = [
  "bg-[#fce4ec] text-[#BF0436] hover:bg-[#f8d7da]",
  "bg-[#d1ecf1] text-[#2D83A6] hover:bg-[#b8e0ea]",
  "bg-[#f8d7da] text-[#8C0327] hover:bg-[#f5c6cb]",
  "bg-[#e8f4f8] text-[#254159] hover:bg-[#d1ecf1]",
  "bg-[#fce4ec] text-[#8C0327] hover:bg-[#f8d7da]",
  "bg-[#d1ecf1] text-[#254159] hover:bg-[#b8e0ea]",
  "bg-[#f8d7da] text-[#BF0436] hover:bg-[#f5c6cb]",
  "bg-[#e8f4f8] text-[#2D83A6] hover:bg-[#d1ecf1]",
];

function hashTag(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash << 5) - hash + tag.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface TagBadgeProps {
  tag: string;
  onClick?: (tag: string) => void;
}

export function TagBadge({ tag, onClick }: TagBadgeProps) {
  const colorClass = TAG_COLORS[hashTag(tag) % TAG_COLORS.length];

  return (
    <Badge
      variant="secondary"
      className={`${colorClass} cursor-pointer text-xs font-medium transition-colors`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.(tag);
      }}
    >
      {tag}
    </Badge>
  );
}
