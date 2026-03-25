"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (trimmed) {
        router.push(`/forum/search?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [router]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      navigate(value);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (timerRef.current) clearTimeout(timerRef.current);
      navigate(query);
    }
  };

  return (
    <div className="relative w-full max-w-xs group">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-parla-blue font-bold transition-colors group-focus-within:text-parla-dark" strokeWidth={3} />
      <input
        type="search"
        placeholder="Buscar..."
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full h-12 pl-12 pr-4 rounded-2xl border-4 border-parla-light bg-parla-mist text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue focus:bg-white transition-all"
      />
    </div>
  );
}