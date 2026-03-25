"use client";

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

// Usamos combinaciones basadas en tus variables de marca para que no desentonen
const TAG_STYLES = [
  "bg-[var(--color-parla-mist)] text-[var(--color-parla-blue)]",
  "bg-[var(--color-parla-red)] text-white",
  "bg-[var(--color-parla-blue)] text-white",
  "bg-[#FFF4F0] text-[#CC7752]", // Naranja suave extra
  "bg-[#F0F7FA] text-[var(--color-parla-dark)]",
];

export function TagBadge({ tag, onClick }: TagBadgeProps) {
  const colorClass = TAG_STYLES[hashTag(tag) % TAG_STYLES.length];

  return (
    <span
      className={`
        ${colorClass} 
        inline-flex items-center px-3 py-1 rounded-xl text-xs font-black tracking-wide
        border-2 border-parla-dark shadow-[0_2px_0_0_var(--color-parla-dark)]
        transition-transform hover:-translate-y-0.5 cursor-pointer
      `}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.(tag);
      }}
    >
      {tag.toUpperCase()}
    </span>
  );
}