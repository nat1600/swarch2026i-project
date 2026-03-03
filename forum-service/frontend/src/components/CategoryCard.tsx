"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Category } from "@/lib/types";

const ACCENT_COLORS = [
  "border-l-[#BF0436]",
  "border-l-[#2D83A6]",
  "border-l-[#8C0327]",
  "border-l-[#254159]",
  "border-l-[#A9CBD9]",
  "border-l-[#BF0436]",
  "border-l-[#2D83A6]",
  "border-l-[#8C0327]",
];

interface CategoryCardProps {
  category: Category;
  index: number;
}

export function CategoryCard({ category, index }: CategoryCardProps) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <Link href={`/categories/${category._id}`}>
      <Card
        className={`border-l-4 ${accent} hover:scale-[1.03] hover:shadow-lg transition-all duration-200 cursor-pointer bg-white/80 backdrop-blur-sm`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {category.name}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 line-clamp-2">
            {category.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
