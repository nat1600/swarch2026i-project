"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Category } from "@/lib/forum/types";

// Usamos los códigos HEX directamente para inyectarlos en la sombra dinámica
const ACCENT_COLORS = [
  "#BF0436", // Red
  "#2D83A6", // Blue
  "#8C0327", // Dark Red
  "#254159", // Dark Blue
  "#A9CBD9", // Light Blue
];

interface CategoryCardProps {
  category: Category;
  index: number;
}

export function CategoryCard({ category, index }: CategoryCardProps) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <Link href={`/forum/categories/${category._id}`} className="block group">
      <Card
        className="bg-white border-4 border-parla-dark rounded-3xl transition-transform duration-200 group-hover:-translate-y-2 group-hover:scale-[1.02] cursor-pointer"
        style={{ boxShadow: `0 8px 0 0 ${accent}` }}
      >
        <CardHeader className="p-6">
          <div className="flex items-center gap-3 mb-2">
            {/* Pequeño punto de color como viñeta */}
            <div 
              className="w-4 h-4 rounded-full border-2 border-parla-dark" 
              style={{ backgroundColor: accent }} 
            />
            <CardTitle className="font-brand text-xl text-parla-dark">
              {category.name}
            </CardTitle>
          </div>
          <CardDescription className="font-semibold text-parla-blue line-clamp-2">
            {category.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}