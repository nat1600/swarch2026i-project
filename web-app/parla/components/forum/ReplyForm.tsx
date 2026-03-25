"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { replyCreateSchema, type ReplyCreateFormData } from "@/lib/forum/schemas";
import { createReply } from "@/lib/forum/api";
import { useUser } from "@auth0/nextjs-auth0";
import type { Reply } from "@/lib/forum/types";
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
  placeholder = "Escribe una respuesta...",
  compact = false,
}: ReplyFormProps) {
  const { user } = useUser();
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
    if (!user?.sub) return;
    setSubmitting(true);
    try {
      const reply = await createReply(
        threadId,
        { content: data.content, parent_reply_id: parentReplyId },
        user.sub
      );
      onCreated(reply);
      reset();
      onCancel?.();
    } catch (err) {
      console.error("Failed to create reply:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-parla-mist border-4 border-dashed border-parla-light rounded-2xl p-4 text-center">
        <p className="font-bold text-parla-blue">
          Inicia sesión para responder.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <textarea
          {...register("content")}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className="w-full rounded-2xl border-4 border-parla-light bg-white p-4 text-parla-dark font-bold placeholder:text-parla-light resize-none focus:outline-none focus:border-parla-blue transition-colors"
        />
        {errors.content && (
          <p className="text-xs font-bold text-parla-red mt-1 px-2">
            {errors.content.message}
          </p>
        )}
      </div>
      
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="font-extrabold text-parla-blue hover:text-parla-dark px-4 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="bg-parla-blue text-white font-black text-sm py-2 px-6 rounded-2xl border-b-[6px] border-[#1e5d78] hover:bg-[#236a87] active:border-b-0 active:translate-y-1.5 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="h-4 w-4" strokeWidth={3} />
          {submitting ? "Enviando..." : "Responder"}
        </button>
      </div>
    </form>
  );
}
