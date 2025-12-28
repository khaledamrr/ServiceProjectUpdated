'use client';

import { useRouter } from 'next/navigation';

interface CategoryCardProps {
  category: any;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const router = useRouter();

  return (
    <div 
      className="category-card"
      onClick={() => router.push(`/categories/${category.slug}`)}
      style={{
        backgroundImage: category.image ? `url(${category.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="category-card-overlay">
        <h3 className="category-card-title">{category.name}</h3>
        {category.description && (
          <p className="category-card-description">{category.description}</p>
        )}
      </div>
    </div>
  );
}
