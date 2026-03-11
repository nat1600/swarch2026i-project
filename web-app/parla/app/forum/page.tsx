"use client";

import { useEffect, useState, useCallback } from "react";
import { getCategories, getThreads } from "@/lib/forum/api";
import type { Category, Thread } from "@/lib/forum/types";
import { CategoryCard } from "@/components/forum/CategoryCard";
import { ThreadComposer } from "@/components/forum/ThreadComposer";
import { ThreadCard } from "@/components/forum/ThreadCard";
import { NavBar } from "@/components/forum/NavBar" // Tu Navbar actualizado
import { ScrollReveal } from "@/components/core/ScrollReveal";

export default function ForoPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoadingCats(false));

    getThreads({ limit: 10 })
      .then((res) => {
        setThreads(res.items);
        setNextCursor(res.next_cursor);
        setHasMore(res.has_more);
      })
      .catch(console.error)
      .finally(() => setLoadingThreads(false));
  }, []);

  const handleThreadCreated = useCallback((thread: Thread) => {
    setThreads((prev) => [thread, ...prev]);
  }, []);

  const handleThreadUpdated = useCallback((updated: Thread) => {
    setThreads((prev) =>
      prev.map((t) => (t._id === updated._id ? updated : t))
    );
  }, []);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getThreads({ limit: 10, after: nextCursor });
      setThreads((prev) => [...prev, ...res.items]);
      setNextCursor(res.next_cursor);
      setHasMore(res.has_more);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="font-app min-h-screen w-full bg-polka overflow-x-hidden selection:bg-parla-blue selection:text-white pb-20">
      
      {/* ══════════════════════════════════════
          NAVBAR PRINCIPAL
      ══════════════════════════════════════ */}
      {/* Si ya pusiste el Navbar en tu layout.tsx, puedes borrar esta línea */}
      <NavBar />

      {/* ══════════════════════════════════════
          CONTENEDOR DEL FORO
      ══════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-10 space-y-16">
        
        {/* CATEGORÍAS */}
        <section>
          <ScrollReveal>
            <h2 className="font-brand text-[clamp(2rem,5vw,2.5rem)] text-parla-dark leading-tight mb-6 flex items-center gap-3">
              <span>📚</span> Categorías
            </h2>
          </ScrollReveal>

          {loadingCats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white/50 border-4 border-parla-dark opacity-20 rounded-3xl p-6 h-32 animate-pulse"></div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white border-4 border-parla-dark rounded-3xl p-8 text-center shadow-[0_8px_0_0_var(--color-parla-dark)]">
              <p className="text-parla-blue font-bold text-lg">Aún no hay categorías disponibles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat, i) => (
                <ScrollReveal
                  key={cat._id}
                  animation="animate-slide-in-bottom"
                  delay={`${i * 100}ms`}
                >
                  <CategoryCard category={cat} index={i} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </section>

        {/* CREAR NUEVO HILO */}
        <section>
          <ScrollReveal animation="animate-slide-in-left">
            <h2 className="font-brand text-[clamp(2rem,5vw,2.5rem)] text-parla-dark leading-tight mb-6 flex items-center gap-3">
              <span>✍️</span> Iniciar Conversación
            </h2>
            
            {/* ThreadComposer ya contiene su propio diseño de caja blanca con bordes */}
            <ThreadComposer
              categories={categories}
              onCreated={handleThreadCreated}
            />
          </ScrollReveal>
        </section>

        {/* HILOS RECIENTES */}
        <section>
          <ScrollReveal animation="animate-slide-in-bottom">
            <h2 className="font-brand text-[clamp(2rem,5vw,2.5rem)] text-parla-dark leading-tight mb-6 flex items-center gap-3">
              <span>🔥</span> Últimos Hilos
            </h2>
          </ScrollReveal>

          {loadingThreads ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border-4 border-parla-dark opacity-20 rounded-4xl h-40 animate-pulse"></div>
              ))}
            </div>
          ) : threads.length === 0 ? (
            <ScrollReveal>
              <div className="bg-white border-4 border-parla-dark rounded-4xl p-12 text-center shadow-[0_8px_0_0_var(--color-parla-dark)]">
                <span className="text-6xl mb-4 block animate-bouncing animate-iteration-count-infinite">👻</span>
                <p className="text-parla-dark font-extrabold text-xl">
                  Aún no hay conversaciones. ¡Sé el primero en romper el hielo!
                </p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="space-y-6">
              {threads.map((t, i) => (
                <ScrollReveal 
                  key={t._id} 
                  animation="animate-fade-in-up" 
                  delay={`${(i % 5) * 100}ms`}
                >
                  <ThreadCard
                    thread={t}
                    onUpdated={handleThreadUpdated}
                  />
                </ScrollReveal>
              ))}

              {/* BOTÓN CARGAR MÁS */}
              {hasMore && (
                <div className="pt-8 flex justify-center">
                  {/* Usamos tu clase global btn-primary en lugar de escribir todo el Tailwind */}
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="btn-primary w-full sm:w-auto"
                  >
                    {loadingMore ? (
                      <>
                        <span className="animate-spin text-2xl">⏳</span>
                        Cargando...
                      </>
                    ) : (
                      <>
                        Cargar más hilos <span className="text-2xl">👇</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}