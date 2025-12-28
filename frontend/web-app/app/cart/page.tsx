'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function Cart() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [cart, setCart] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    setIsLoggedIn(!!token);
    loadCart();
  }, []);

  const loadCart = () => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(cartData);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedCart = cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    );

    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (productId: string) => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    showToast({ message: 'Item removed from cart', type: 'success' });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.setItem('cart', JSON.stringify([]));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      showToast({ message: 'Please login to checkout', type: 'warning' });
      setTimeout(() => router.push('/login'), 1500);
      return;
    }
    if (cart.length === 0) {
      showToast({ message: 'Your cart is empty', type: 'info' });
      return;
    }

    router.push('/checkout');
  };

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
      <main className="container">
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Your cart is empty</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Add some products to get started!
            </p>
            <button
              className="btn btn-primary"
              onClick={() => router.push('/products')}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="cart-container">
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.productId} className="cart-item">
                  <div className="cart-item-image">📦</div>

                  <div className="cart-item-details">
                    <h3
                      className="cart-item-name"
                      onClick={() => router.push(`/products/${item.productId}`)}
                    >
                      {item.productName}
                    </h3>
                    <p className="cart-item-price">${item.price.toFixed(2)} each</p>
                  </div>

                  <div className="cart-item-quantity">
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>

                  <button
                    className="cart-item-remove"
                    onClick={() => removeItem(item.productId)}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                className="btn btn-secondary"
                onClick={clearCart}
                style={{ marginTop: '1rem' }}
              >
                Clear Cart
              </button>
            </div>

            <div className="cart-summary">
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Order Summary</h2>

              <div className="summary-row">
                <span>Subtotal ({cart.length} items):</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>Shipping:</span>
                <span>Free</span>
              </div>

              <div className="summary-row">
                <span>Tax:</span>
                <span>${(calculateTotal() * 0.1).toFixed(2)}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row summary-total">
                <span>Total:</span>
                <span>${(calculateTotal() * 1.1).toFixed(2)}</span>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleCheckout}
                style={{ width: '100%', marginTop: '1.5rem', fontSize: '1.1rem' }}
              >
                Proceed to Checkout
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => router.push('/products')}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          .cart-container {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
            margin-top: 2rem;
          }

          @media (max-width: 768px) {
            .cart-container {
              grid-template-columns: 1fr;
            }
          }

          .cart-items {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .cart-item {
            background: white;
            padding: 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            display: grid;
            grid-template-columns: 80px 1fr auto auto auto;
            gap: 1.5rem;
            align-items: center;
          }

          @media (max-width: 768px) {
            .cart-item {
              grid-template-columns: 60px 1fr;
              gap: 1rem;
            }
            
            .cart-item-quantity,
            .cart-item-total {
              grid-column: 2;
            }
          }

          .cart-item-image {
            width: 80px;
            height: 80px;
            background: #e5e7eb;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
          }

          .cart-item-details {
            flex: 1;
          }

          .cart-item-name {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            cursor: pointer;
            color: #333;
          }

          .cart-item-name:hover {
            color: #4f46e5;
          }

          .cart-item-price {
            color: #6b7280;
          }

          .cart-item-quantity {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .quantity-btn {
            width: 32px;
            height: 32px;
            border: 2px solid #4f46e5;
            background: white;
            color: #4f46e5;
            border-radius: 0.25rem;
            font-size: 1.25rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .quantity-btn:hover {
            background: #4f46e5;
            color: white;
          }

          .quantity-display {
            font-size: 1.1rem;
            font-weight: 600;
            min-width: 30px;
            text-align: center;
          }

          .cart-item-total {
            font-size: 1.25rem;
            font-weight: bold;
            color: #4f46e5;
            min-width: 100px;
            text-align: right;
          }

          .cart-item-remove {
            width: 32px;
            height: 32px;
            border: none;
            background: #fee2e2;
            color: #991b1b;
            border-radius: 0.25rem;
            font-size: 1.25rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .cart-item-remove:hover {
            background: #ef4444;
            color: white;
          }

          .cart-summary {
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            height: fit-content;
            position: sticky;
            top: 2rem;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
            font-size: 1rem;
          }

          .summary-divider {
            border-top: 2px solid #e5e7eb;
            margin: 1.5rem 0;
          }

          .summary-total {
            font-size: 1.5rem;
            font-weight: bold;
            color: #4f46e5;
          }
        `}</style>
      </main>
    </>
  );
}

