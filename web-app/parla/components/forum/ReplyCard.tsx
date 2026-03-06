"use client";

import { useState } from "react";
import { LikeButton } from "@/components/forum/LikeButton";
import { ReplyForm } from "@/components/forum/ReplyForm";
import { likeReply, unlikeReply } from "@/lib/forum/api";
import { useUser } from "@auth0/nextjs-auth0";
import type { Reply } from "@/lib/forum/types";
import { Clock, Pencil, MessageCircle } from "lucide-react";

const INDENT_COLORS = [
  "border-l-[#BF0436]",
  "border-l-[#2D83A6]",
  "border-l-[#8C0327]",
  "border-l-[#A9CBD9]",
  "border-l-[#254159]",
];

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
  return `hace ${months} meses`;
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
  const { user } = useUser();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const borderColor = INDENT_COLORS[depth % INDENT_COLORS.length];
  const isAuthor = user?.sub === reply.user_id;

  return (
    <div className={depth > 0 ? `ml-4 pl-4 border-l-4 ${borderColor}` : ""}>
      <div className="py-4">
        {/* Reply content */}
        <p className="text-parla-dark font-semibold whitespace-pre-wrap leading-relaxed">
          {reply.content}
        </p>

        {/* Reply footer */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <LikeButton
            likes={reply.likes}
            likesCount={reply.likes_count}
            onLike={async () => {
              const updated = await likeReply(reply._id, user?.sub ?? undefined);
              onReplyUpdated(updated);
            }}
            onUnlike={async () => {
              const updated = await unlikeReply(reply._id, user?.sub ?? undefined);
              onReplyUpdated(updated);
            }}
          />

          <button
            className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-black text-parla-blue border-2 border-parla-light hover:bg-parla-mist hover:border-parla-blue transition-all disabled:opacity-50"
            onClick={() => setShowReplyForm(!showReplyForm)}
            disabled={!user?.sub}
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
            Responder
          </button>

          {isAuthor && onEdit && (
            <button
              className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-black text-parla-blue border-2 border-parla-light hover:bg-parla-mist hover:border-parla-blue transition-all"
              onClick={() => onEdit(reply)}
            >
              Editar
            </button>
          )}

          {isAuthor && onDelete && (
            <button
              className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-black text-parla-red border-2 border-parla-light hover:bg-red-50 hover:border-parla-red transition-all"
              onClick={() => onDelete(reply)}
            >
              Eliminar
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-bold text-parla-light ml-auto">
            <span className="bg-parla-mist px-2 py-1 rounded-lg border-2 border-parla-light">
              @{reply.user_id.substring(0, 8)}...
            </span>
            <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span>{timeAgo(reply.created_at)}</span>
            {reply.updated_at && (
              <span className="inline-flex items-center gap-1 text-parla-blue">
                <Pencil className="h-3 w-3" />
                editado
              </span>
            )}
          </div>
        </div>

        {/* Inline reply form */}
        {showReplyForm && (
          <div className="mt-4">
            <ReplyForm
              threadId={threadId}
              parentReplyId={reply._id}
              onCreated={(newReply) => {
                onReplyCreated(newReply);
                setShowReplyForm(false);
              }}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Responder a @${reply.user_id.substring(0, 8)}...`}
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
