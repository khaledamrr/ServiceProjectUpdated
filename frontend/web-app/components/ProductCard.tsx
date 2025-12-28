'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import Toast from './Toast';

interface ProductCardProps {
  product: any;
  onAddToCart?: (product: any) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: 1,
      });
      localStorage.setItem('cart', JSON.stringify(cart));
      showToast({ message: 'Added to cart!', type: 'success' });
    }
  };

  const productImage = product.coverImage || product.images?.[0] || '/placeholder-product.jpg';

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
      <div 
        className="product-card-modern"
        onClick={() => router.push(`/products/${product._id}`)}
      >
        <div className="product-card-image-container">
          <img
            src={productImage}
            alt={product.name}
            className="product-card-image"
          />
          <div className="product-card-overlay">
            <button
              className="product-card-quick-view"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/products/${product._id}`);
              }}
            >
              Quick View
            </button>
          </div>
        </div>
        <div className="product-card-content">
          <h3 className="product-card-title">{product.name}</h3>
          <p className="product-card-description">
            {product.description?.substring(0, 60)}
            {product.description?.length > 60 ? '...' : ''}
          </p>
          <div className="product-card-footer">
            <span className="product-card-price">${product.price}</span>
            <button
              className="product-card-add-btn"
              onClick={handleAddToCart}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
