'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderApi, paymentApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export default function Checkout() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cvc: '',
    email: '',
    cardName: '',
    expiryDate: '',
  });
  const [cardType, setCardType] = useState<string>('');

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cartData.length === 0) {
      router.push('/cart');
      return;
    }
    setCart(cartData);
  }, []);

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = cleaned.match(/.{1,4}/g);
    return matches ? matches.join(' ') : cleaned;
  };

  // Detect card type
  const detectCardType = (number: string): string => {
    const cleaned = number.replace(/\s+/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6/.test(cleaned)) return 'discover';
    return '';
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Format CVC (numbers only)
  const formatCVC = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 4);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    const detectedType = detectCardType(formatted);
    setCardType(detectedType);
    setPaymentDetails({ ...paymentDetails, cardNumber: formatted });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setPaymentDetails({ ...paymentDetails, expiryDate: formatted });
  };

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCVC(e.target.value);
    setPaymentDetails({ ...paymentDetails, cvc: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create Order
      const orderData = {
        items: cart,
        totalAmount: calculateTotal() * 1.1, // Including tax
        shippingAddress: formData,
      };

      const orderResponse = await orderApi.create(orderData);

      if (!orderResponse.data || !orderResponse.data.success) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResponse.data.data._id || orderResponse.data.data.id;
      const amount = orderResponse.data.data.totalAmount;

      // 2. Process Payment
      let paymentPayload: any = {
        orderId,
        amount,
        paymentMethod,
      };

      if (paymentMethod === 'paypal') {
        paymentPayload.payerEmail = paymentDetails.email;
      } else {
        // Clean card number (remove spaces) before sending
        const cleanCardNumber = paymentDetails.cardNumber.replace(/\s+/g, '');
        if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
          throw new Error('Invalid card number. Please enter a valid card number.');
        }
        if (paymentDetails.cvc.length < 3) {
          throw new Error('Invalid CVC. Please enter a valid 3-4 digit CVC.');
        }
        if (!paymentDetails.expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
          throw new Error('Invalid expiry date. Please use MM/YY format.');
        }

        paymentPayload.cardDetails = {
          number: cleanCardNumber,
          cvc: paymentDetails.cvc,
          name: paymentDetails.cardName,
          expiry: paymentDetails.expiryDate,
          last4: cleanCardNumber.slice(-4)
        };
      }

      // Process Payment using the imported api with retry logic
      let paymentResponse;
      let retries = 3;
      let lastError;
      
      while (retries > 0) {
        try {
          paymentResponse = await paymentApi.process(paymentPayload);
          break;
        } catch (err: any) {
          lastError = err;
          retries--;
          if (retries > 0) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          }
        }
      }
      
      if (!paymentResponse) {
        throw lastError || new Error('Payment processing failed after multiple attempts');
      }

      if (paymentResponse.data.success) {
        // Update order with payment information
        try {
          await orderApi.updatePayment(
            orderId,
            paymentResponse.data.data.paymentId,
            'paid'
          );
        } catch (updateError: any) {
          console.error('Failed to update order payment info:', updateError);
          // Don't fail the whole checkout if this fails
        }

        // Clear cart
        localStorage.setItem('cart', JSON.stringify([]));
        showToast({ message: 'Order placed and paid successfully!', type: 'success' });
        setTimeout(() => router.push('/orders'), 1500);
      } else {
        setError(`Payment failed: ${paymentResponse.data.message || 'Unknown error'}`);
        // Optionally redirect to orders page to pay later, but for now let them retry
      }

    } catch (err: any) {
      console.error('Checkout error:', err);
      
      // Better error messages
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again in a moment.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid payment information. Please check your details.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to process order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
          Checkout
        </h1>

        {error && <div className="error">{error}</div>}

        <div className="checkout-container">
          <div className="checkout-form">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Shipping Address</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Zip Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Country</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01012345678 or +201012345678"
                  pattern="^(\+20|0)?1[0125]\d{8}$"
                  title="Please enter a valid Egyptian phone number (11 digits starting with 01, or with +20)"
                  required
                />
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Required for delivery contact (Egyptian mobile: 01X XXXX XXXX)
                </p>
              </div>

              <hr style={{ margin: '2rem 0', borderTop: '1px solid #e5e7eb' }} />

              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Payment Details</h2>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              {paymentMethod === 'paypal' ? (
                <div className="form-group">
                  <label className="form-label">PayPal Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={paymentDetails.email}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, email: e.target.value })}
                    required
                    placeholder="you@example.com"
                  />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Name on Card</label>
                    <input
                      type="text"
                      className="form-input"
                      value={paymentDetails.cardName}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={paymentDetails.cardNumber}
                        onChange={handleCardNumberChange}
                        required
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        style={{ 
                          paddingRight: cardType ? '3rem' : '1rem',
                          letterSpacing: '0.1em'
                        }}
                      />
                      {cardType && (
                        <div style={{
                          position: 'absolute',
                          right: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#4f46e5',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {cardType}
                        </div>
                      )}
                    </div>
                    {paymentDetails.cardNumber && (
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {cardType ? `Detected: ${cardType.charAt(0).toUpperCase() + cardType.slice(1)}` : 'Enter card number to detect type'}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Expiry Date</label>
                      <input
                        type="text"
                        className="form-input"
                        value={paymentDetails.expiryDate}
                        onChange={handleExpiryChange}
                        required
                        placeholder="MM/YY"
                        maxLength={5}
                        pattern="(0[1-9]|1[0-2])\/\d{2}"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVC</label>
                      <input
                        type="text"
                        className="form-input"
                        value={paymentDetails.cvc}
                        onChange={handleCVCChange}
                        required
                        placeholder="123"
                        maxLength={4}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => router.push('/cart')}
              >
                Back to Cart
              </button>
            </form>
          </div>

          <div className="checkout-summary">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Order Summary</h2>

            <div className="order-items">
              {cart.map((item) => (
                <div key={item.productId} className="order-item">
                  <div>
                    <div style={{ fontWeight: '600' }}>{item.productName}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                      ${item.price.toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontWeight: '600' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '1rem', paddingTop: '1rem' }}>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>Shipping:</span>
                <span>Free</span>
              </div>

              <div className="summary-row">
                <span>Tax (10%):</span>
                <span>${(calculateTotal() * 0.1).toFixed(2)}</span>
              </div>

              <div style={{ borderTop: '2px solid #e5e7eb', marginTop: '1rem', paddingTop: '1rem' }}>
                <div className="summary-row" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5' }}>
                  <span>Total:</span>
                  <span>${(calculateTotal() * 1.1).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .checkout-container {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
            margin-top: 2rem;
          }

          @media (max-width: 768px) {
            .checkout-container {
              grid-template-columns: 1fr;
            }
          }

          .checkout-form {
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .checkout-summary {
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            height: fit-content;
            position: sticky;
            top: 2rem;
          }

          .order-items {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .order-item {
            display: flex;
            justify-content: space-between;
            align-items: start;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .order-item:last-child {
            border-bottom: none;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.75rem;
          }
        `}</style>
      </main>
    </>
  );
}

