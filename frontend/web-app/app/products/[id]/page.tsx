'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productApi } from '@/lib/api';

export default function ProductDetails() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await productApi.getOne(params.id as string);
      setProduct(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    // Get existing cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart
    const existingItemIndex = cart.findIndex((item: any) => item.productId === product._id);
    
    if (existingItemIndex > -1) {
      // Update quantity if already in cart
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.push({
        productId: product._id,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        image: product.images?.[0] || null,
      });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show success message
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 999)) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <>
        <main className="container">
          <div className="loading">Loading product details...</div>
        </main>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <main className="container">
          <div className="error">{error || 'Product not found'}</div>
          <button className="btn btn-secondary" onClick={() => router.push('/products')}>
            Back to Products
          </button>
        </main>
      </>
    );
  }

  return (
    <>

      <main className="container">
        <button 
          className="btn btn-secondary" 
          onClick={() => router.push('/products')}
          style={{ marginBottom: '2rem',marginTop: '2rem' }}
        >
          ← Back to Products
        </button>

        {addedToCart && (
          <div className="success">
            ✓ Product added to cart successfully!
          </div>
        )}

        <div className="product-details-container">
          <div className="product-details-image">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.name} 
                className="product-image-large" 
              />
            ) : (
              <div className="product-image-large">
                📦
              </div>
            )}
          </div>

          <div className="product-details-info">
            <h1 className="product-details-title">{product.name}</h1>
            
            <div className="product-details-price">{product.price.toFixed(2)} EGP</div>

            <div className="product-details-category">
              <strong>Category:</strong> {typeof product.category === 'object' ? product.category?.name : product.category || 'N/A'}
            </div>

            <div className="product-details-stock">
              <strong>Stock:</strong> 
              <span style={{ 
                color: product.stock > 10 ? '#10b981' : product.stock > 0 ? '#f59e0b' : '#ef4444',
                marginLeft: '0.5rem'
              }}>
                {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
              </span>
            </div>

            <div className="product-details-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="product-details-specs">
                <h3>Specifications</h3>
                <ul>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.stock > 0 && (
              <div className="product-details-actions">
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="quantity-display">{quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button 
                  className="btn btn-primary btn-add-to-cart"
                  onClick={addToCart}
                >
                  🛒 Add to Cart
                </button>

                <button 
                  className="btn btn-secondary"
                  onClick={() => router.push('/cart')}
                  style={{ marginTop: '1rem' }}
                >
                  View Cart
                </button>
              </div>
            )}

            {product.stock === 0 && (
              <div className="out-of-stock-message">
                This product is currently out of stock
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .product-details-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            margin-top: 2rem;
          }

          @media (max-width: 768px) {
            .product-details-container {
              grid-template-columns: 1fr;
            }
          }

          .product-details-image {
            position: sticky;
            top: 2rem;
            height: fit-content;
          }

          .product-image-large {
            width: 100%;
            height: 400px;
            background: #e5e7eb;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8rem;
          }

          .product-details-info {
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .product-details-title {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
            color: #333;
          }

          .product-details-price {
            font-size: 2.5rem;
            color: #4f46e5;
            font-weight: bold;
            margin-bottom: 1.5rem;
          }

          .product-details-category,
          .product-details-stock {
            margin-bottom: 1rem;
            font-size: 1.1rem;
          }

          .product-details-description {
            margin: 2rem 0;
            padding: 1.5rem;
            background: #f9fafb;
            border-radius: 0.5rem;
          }

          .product-details-description h3 {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
            color: #333;
          }

          .product-details-description p {
            line-height: 1.6;
            color: #6b7280;
          }

          .product-details-specs {
            margin: 2rem 0;
            padding: 1.5rem;
            background: #f9fafb;
            border-radius: 0.5rem;
          }

          .product-details-specs h3 {
            font-size: 1.25rem;
            margin-bottom: 1rem;
            color: #333;
          }

          .product-details-specs ul {
            list-style: none;
            padding: 0;
          }

          .product-details-specs li {
            padding: 0.5rem 0;
            border-bottom: 1px solid #e5e7eb;
          }

          .product-details-specs li:last-child {
            border-bottom: none;
          }

          .product-details-actions {
            margin-top: 2rem;
          }

          .quantity-selector {
            margin-bottom: 1.5rem;
          }

          .quantity-selector label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
          }

          .quantity-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .quantity-btn {
            width: 40px;
            height: 40px;
            border: 2px solid #4f46e5;
            background: white;
            color: #4f46e5;
            border-radius: 0.5rem;
            font-size: 1.5rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .quantity-btn:hover:not(:disabled) {
            background: #4f46e5;
            color: white;
          }

          .quantity-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .quantity-display {
            font-size: 1.5rem;
            font-weight: bold;
            min-width: 40px;
            text-align: center;
          }

          .btn-add-to-cart {
            width: 100%;
            font-size: 1.25rem;
            padding: 1rem;
          }

          .out-of-stock-message {
            background: #fee2e2;
            color: #991b1b;
            padding: 1rem;
            border-radius: 0.5rem;
            text-align: center;
            font-weight: 600;
            margin-top: 2rem;
          }
        `}</style>
      </main>
    </>
  );
}

