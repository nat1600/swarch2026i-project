"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * ScrollReveal — componente ligero de scroll-reveal con IntersectionObserver.
 *
 * Reemplaza el enfoque CSS-only `timeline-view` que tiene problemas de
 * compatibilidad y cascada (animation shorthand resetea animation-timeline).
 *
 * Uso:
 *   <ScrollReveal animation="animate-fade-in-up">
 *     <h2>Contenido</h2>
 *   </ScrollReveal>
 *
 *   <ScrollReveal animation="animate-slide-in-bottom" delay="200ms">
 *     <div>Tarjeta</div>
 *   </ScrollReveal>
 *
 * Props:
 *   animation  — clase de tailwind-animations a aplicar al ser visible
 *   delay      — animationDelay CSS (e.g. "200ms")
 *   threshold  — porcentaje de visibilidad para disparar (0-1, default 0.15)
 *   className  — clases extra para el wrapper
 *   as         — elemento HTML del wrapper (default "div")
 */

type RevealTag = "div" | "section" | "article" | "span" | "aside" | "header";

interface ScrollRevealProps {
  children: ReactNode;
  animation?: string;
  delay?: string;
  threshold?: number;
  className?: string;
  as?: RevealTag;
  style?: React.CSSProperties;
}

export function ScrollReveal({
  children,
  animation = "animate-fade-in-up",
  delay,
  threshold = 0.15,
  className = "",
  as: Tag = "div",
  style,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  /*
   * Siempre mantenemos `opacity-0` en el className.
   * Cuando isVisible es true, la clase de animación (e.g. animate-fade-in-up)
   * arranca desde opacity:0 en su keyframe y termina en opacity:1 con
   * fill-mode:both, lo que sobreescribe el opacity-0 de Tailwind.
   * Esto evita el flash de un frame visible entre quitar opacity-0 y
   * que el navegador aplique la animación.
   */
  const classes = isVisible
    ? `${className} ${animation}`
    : `${className} opacity-0`;

    

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={classes}
      style={delay ? { animationDelay: delay, ...style } : style}
    >
      {children}
    </Tag>
  );
}
