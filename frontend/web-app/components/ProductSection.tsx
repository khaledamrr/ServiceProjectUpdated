'use client';

import ProductCard from './ProductCard';

interface ProductSectionProps {
  section: any;
}

export default function ProductSection({ section }: ProductSectionProps) {
  if (!section.products || section.products.length === 0) {
    return null;
  }

  return (
    <section className="product-section">
      <div className="product-section-header">
        <div>
          <h2 className="product-section-title">{section.title}</h2>
          {section.subtitle && (
            <p className="product-section-subtitle">{section.subtitle}</p>
          )}
        </div>
        {section.categoryId && (
          <a href={`/categories/${section.categoryId}`} className="product-section-view-all">
            View All →
          </a>
        )}
      </div>
      <div className="product-section-grid">
        {section.products.slice(0, section.limit || 8).map((product: any) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
