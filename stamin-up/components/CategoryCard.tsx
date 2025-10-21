import Link from "next/link";
import { Category } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/services?category=${category.slug}`}>
      <Card className="group h-full transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-1 rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          {/* Name */}
          <h3 className="heading-lg mb-3 text-[var(--color-primary)] group-hover:text-[var(--color-primary-dark)]">
            {category.name}
          </h3>

          {/* Description */}
          <p className="body-base text-[var(--color-text-secondary)] line-clamp-2">
            {category.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
