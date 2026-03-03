"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  threadCreateSchema,
  type ThreadCreateFormData,
} from "@/lib/schemas";
import { createThread } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import type { Category, Thread } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, ChevronDown } from "lucide-react";

interface ThreadComposerProps {
  categories: Category[];
  onCreated: (thread: Thread) => void;
}

export function ThreadComposer({ categories, onCreated }: ThreadComposerProps) {
  const { userId } = useUser();
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ThreadCreateFormData>({
    resolver: zodResolver(threadCreateSchema),
    defaultValues: {
      category_id: "",
      title: "",
      content: "",
      tags: "",
    },
  });

  const onSubmit = async (data: ThreadCreateFormData) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const tags = data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const thread = await createThread({
        category_id: data.category_id,
        title: data.title,
        content: data.content,
        tags,
      });
      onCreated(thread);
      reset();
      setExpanded(false);
    } catch (err) {
      console.error("Failed to create thread:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50 p-6 text-center">
        <p className="text-gray-400 text-sm">
          Enter your User ID in the top bar to start a new thread.
        </p>
      </Card>
    );
  }

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 border-[#A9CBD9]/50 bg-white/90 backdrop-blur-sm ${
        expanded ? "shadow-lg ring-1 ring-[#A9CBD9]/50" : ""
      }`}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Collapsed state: click to expand */}
        {!expanded ? (
          <button
            type="button"
            onClick={() => {
              setExpanded(true);
              setTimeout(() => contentRef.current?.focus(), 100);
            }}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#fce4ec]/30 transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#BF0436] to-[#8C0327] text-white text-sm font-bold">
              {userId.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-400 text-sm">
              Start a new thread...
            </span>
          </button>
        ) : (
          <div className="p-4 space-y-3">
            {/* Category selector + Title */}
            <div className="flex gap-3">
              <div className="relative shrink-0 w-44">
                <select
                  {...register("category_id")}
                  className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#2D83A6] focus:border-transparent"
                >
                  <option value="">Category...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                {errors.category_id && (
                  <p className="text-xs text-[#BF0436] mt-1">
                    {errors.category_id.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <Input
                  {...register("title")}
                  placeholder="Thread title"
                  className="h-9 border-gray-200 focus-visible:ring-[#2D83A6]"
                />
                {errors.title && (
                  <p className="text-xs text-[#BF0436] mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <Textarea
                {...register("content")}
                ref={(e) => {
                  register("content").ref(e);
                  (contentRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
                }}
                placeholder="What do you want to discuss?"
                rows={3}
                className="resize-none border-gray-200 focus-visible:ring-[#2D83A6]"
              />
              {errors.content && (
                <p className="text-xs text-[#BF0436] mt-1">
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* Tags + Actions */}
            <div className="flex items-center gap-3">
              <Input
                {...register("tags")}
                placeholder="Tags (comma-separated)"
                className="h-8 text-sm flex-1 border-gray-200 focus-visible:ring-[#A9CBD9]"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  reset();
                  setExpanded(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-gradient-to-r from-[#BF0436] to-[#8C0327] hover:from-[#8C0327] hover:to-[#6b0220] text-white gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
}
