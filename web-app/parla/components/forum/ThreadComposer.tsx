"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { threadCreateSchema, type ThreadCreateFormData } from "@/lib/forum/schemas";
import { createThread } from "@/lib/forum/api";
import { useUser } from "@auth0/nextjs-auth0"; // Asegúrate de que este context funcione con Auth0
import type { Category, Thread } from "@/lib/forum/types";
import { Send, ChevronDown, PenLine } from "lucide-react";

interface ThreadComposerProps {
  categories: Category[];
  onCreated: (thread: Thread) => void;
}

export function ThreadComposer({ categories, onCreated }: ThreadComposerProps) {
  const { user } = useUser();
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
    if (!user?.sub) return;
    setSubmitting(true);
    try {
      const tags = data.tags
        ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      const thread = await createThread(
        {
          category_id: data.category_id,
          title: data.title,
          content: data.content,
          tags,
        },
        user.sub
      );
      onCreated(thread);
      reset();
      setExpanded(false);
    } catch (err) {
      console.error("Failed to create thread:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user?.sub) {
    return (
      <div className="border-4 border-dashed border-parla-light bg-[#F8FAFC] rounded-3xl p-8 text-center">
        <p className="font-bold text-parla-blue text-lg">
          Inicia sesión para empezar una nueva conversación.
        </p>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-300 ${expanded ? "scale-[1.01]" : ""}`}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {!expanded ? (
          <button
            type="button"
            onClick={() => {
              setExpanded(true);
              setTimeout(() => contentRef.current?.focus(), 100);
            }}
            className="w-full flex items-center gap-4 p-5 bg-white border-4 border-parla-dark shadow-[0_6px_0_0_#254159] rounded-full hover:-translate-y-1 hover:shadow-[0_8px_0_0_#254159] transition-all cursor-text"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-parla-blue border-2 border-parla-dark text-white text-xl font-black">
              <PenLine className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-parla-dark text-lg opacity-70">
              ¿De qué quieres hablar hoy?...
            </span>
          </button>
        ) : (
          <div className="bg-white border-4 border-parla-dark shadow-[0_8px_0_0_#254159] rounded-3xl p-6 space-y-4">
            
            {/* Category selector + Title */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative shrink-0 sm:w-48">
                <select
                  {...register("category_id")}
                  className="w-full h-12 rounded-2xl border-4 border-parla-light bg-[#F8FAFC] px-4 pr-10 text-parla-dark font-bold appearance-none focus:outline-none focus:border-parla-blue transition-colors"
                >
                  <option value="">Categoría...</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-parla-blue pointer-events-none stroke-3" />
                {errors.category_id && (
                  <p className="text-xs text-parla-red font-bold mt-1 px-2">{errors.category_id.message}</p>
                )}
              </div>

              <div className="flex-1">
                <input
                  {...register("title")}
                  placeholder="Título del hilo"
                  className="w-full h-12 rounded-2xl border-4 border-parla-light bg-[#F8FAFC] px-4 text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors"
                />
                {errors.title && (
                  <p className="text-xs text-parla-red font-bold mt-1 px-2">{errors.title.message}</p>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <textarea
                {...register("content")}
                ref={(e) => {
                  register("content").ref(e);
                  (contentRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
                }}
                placeholder="Escribe tu mensaje aquí..."
                rows={4}
                className="w-full rounded-2xl border-4 border-parla-light bg-[#F8FAFC] p-4 text-parla-dark font-bold placeholder:text-parla-light resize-none focus:outline-none focus:border-parla-blue transition-colors"
              />
              {errors.content && (
                <p className="text-xs text-parla-red font-bold mt-1 px-2">{errors.content.message}</p>
              )}
            </div>

            {/* Tags + Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <input
                {...register("tags")}
                placeholder="Tags (ej: gramática, duda, vocabulario)"
                className="w-full sm:flex-1 h-12 rounded-2xl border-4 border-parla-light bg-[#F8FAFC] px-4 text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors"
              />
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setExpanded(false);
                  }}
                  className="font-extrabold text-parla-blue hover:text-parla-dark px-4 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 sm:flex-none bg-parla-red text-white font-extrabold text-lg py-3 px-8 rounded-2xl border-b-8 border-[#8C0327] hover:bg-[#a6032f] active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="h-5 w-5" />
                  {submitting ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}