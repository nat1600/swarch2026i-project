"use client";

import { useState } from "react";
import { LikeButton } from "@/components/LikeButton";
import { ReplyForm } from "@/components/ReplyForm";
import { likeReply, unlikeReply } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import type { Reply } from "@/lib/types";
import { Clock, Pencil, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const INDENT_COLORS = [
  "border-l-[#BF0436]",
  "border-l-[#2D83A6]",
  "border-l-[#8C0327]",
  "border-l-[#A9CBD9]",
  "border-l-[#254159]",
  "border-l-[#BF0436]",
];

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

interface ReplyCardProps {
  reply: Reply;
  threadId: string;
  depth?: number;
  childReplies?: Reply[];
  onReplyCreated: (reply: Reply) => void;
  onReplyUpdated: (reply: Reply) => void;
  onEdit?: (reply: Reply) => void;
  onDelete?: (reply: Reply) => void;
}

export function ReplyCard({
  reply,
  threadId,
  depth = 0,
  childReplies = [],
  onReplyCreated,
  onReplyUpdated,
  onEdit,
  onDelete,
}: ReplyCardProps) {
  const { userId } = useUser();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const borderColor = INDENT_COLORS[depth % INDENT_COLORS.length];
  const isAuthor = userId === reply.user_id;

  return (
    <div
      className={`${depth > 0 ? `ml-4 pl-4 border-l-2 ${borderColor}` : ""}`}
    >
      <div className="py-3">
        {/* Reply content */}
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {reply.content}
        </p>

        {/* Reply footer */}
        <div className="flex items-center gap-3 mt-2">
          <LikeButton
            likes={reply.likes}
            likesCount={reply.likes_count}
            onLike={async () => {
              const updated = await likeReply(reply._id);
              onReplyUpdated(updated);
            }}
            onUnlike={async () => {
              const updated = await unlikeReply(reply._id);
              onReplyUpdated(updated);
            }}
          />

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-gray-400 hover:text-[#2D83A6] hover:bg-[#d1ecf1]"
            onClick={() => setShowReplyForm(!showReplyForm)}
            disabled={!userId}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1" />
            Reply
          </Button>

          {isAuthor && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-gray-400 hover:text-[#2D83A6] hover:bg-[#d1ecf1]"
              onClick={() => onEdit(reply)}
            >
              Edit
            </Button>
          )}

          {isAuthor && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-gray-400 hover:text-[#BF0436] hover:bg-[#fce4ec]"
              onClick={() => onDelete(reply)}
            >
              Delete
            </Button>
          )}

          <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
            <span className="font-mono">{reply.user_id}</span>
            <span className="mx-1">-</span>
            <Clock className="h-3 w-3" />
            <span>{timeAgo(reply.created_at)}</span>
            {reply.updated_at && (
              <span className="inline-flex items-center gap-0.5 text-[#2D83A6] ml-1">
                <Pencil className="h-3 w-3" />
                edited
              </span>
            )}
          </div>
        </div>

        {/* Inline reply form */}
        {showReplyForm && (
          <div className="mt-3">
            <ReplyForm
              threadId={threadId}
              parentReplyId={reply._id}
              onCreated={(newReply) => {
                onReplyCreated(newReply);
                setShowReplyForm(false);
              }}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Reply to ${reply.user_id}...`}
              compact
            />
          </div>
        )}
      </div>

      {/* Nested child replies */}
      {childReplies.length > 0 && (
        <div>
          {childReplies.map((child) => (
            <ReplyCard
              key={child._id}
              reply={child}
              threadId={threadId}
              depth={depth + 1}
              childReplies={[]}
              onReplyCreated={onReplyCreated}
              onReplyUpdated={onReplyUpdated}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
