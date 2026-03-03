"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  replyCreateSchema,
  type ReplyCreateFormData,
} from "@/lib/schemas";
import { createReply } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import type { Reply } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState } from "react";

interface ReplyFormProps {
  threadId: string;
  parentReplyId?: string | null;
  onCreated: (reply: Reply) => void;
  onCancel?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export function ReplyForm({
  threadId,
  parentReplyId = null,
  onCreated,
  onCancel,
  placeholder = "Write a reply...",
  compact = false,
}: ReplyFormProps) {
  const { userId } = useUser();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyCreateFormData>({
    resolver: zodResolver(replyCreateSchema),
    defaultValues: { content: "" },
  });

  const onSubmit = async (data: ReplyCreateFormData) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const reply = await createReply(threadId, {
        content: data.content,
        parent_reply_id: parentReplyId,
      });
      onCreated(reply);
      reset();
      onCancel?.();
    } catch (err) {
      console.error("Failed to create reply:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <p className="text-sm text-gray-400 italic py-2">
        Enter your User ID to reply.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <Textarea
        {...register("content")}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        className="resize-none border-gray-200 focus-visible:ring-[#2D83A6] bg-white/80 text-sm"
      />
      {errors.content && (
        <p className="text-xs text-[#BF0436]">{errors.content.message}</p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={submitting}
          className="bg-gradient-to-r from-[#2D83A6] to-[#254159] hover:from-[#254159] hover:to-[#1a3040] text-white gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? "Posting..." : "Reply"}
        </Button>
      </div>
    </form>
  );
}
