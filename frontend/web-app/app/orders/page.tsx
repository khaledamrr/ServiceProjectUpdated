'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderApi, paymentApi } from '@/lib/api';

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<Record<string, any>>({});
  const [refundStatus, setRefundStatus] = useState<Record<string, { status: 'success' | 'error' | null; message: string }>>({});

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderApi.getAll();
      const ordersData = response.data.data || [];
      setOrders(ordersData);
      
      // Fetch payment info for orders with paymentId or paid status
      const paymentPromises = ordersData
        .filter((order: any) => order.paymentId || order.paymentStatus === 'paid' || order.paymentStatus === 'completed')
        .map(async (order: any) => {
          try {
            // Get payment by orderId (payment service uses orderId to find payment)
            const paymentStatus = await paymentApi.getStatus(order._id);
            if (paymentStatus.data.success) {
              return { orderId: order._id, payment: paymentStatus.data.data };
            }
          } catch (err) {
            // Payment might not exist yet, that's okay
            return null;
          }
        });
      
      const paymentResults = await Promise.all(paymentPromises);
      const paymentMap: Record<string, any> = {};
      paymentResults.forEach((result) => {
        if (result) {
          paymentMap[result.orderId] = result.payment;
        }
      });
      setPaymentInfo(paymentMap);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444',
      refunded: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const handleRefund = async (order: any) => {
    setRefundingOrderId(order._id);
    setRefundStatus(prev => ({ ...prev, [order._id]: { status: null, message: '' } }));
    
    try {
      // Get payment information
      let paymentId: string;
      
      if (order.paymentId) {
        paymentId = order.paymentId;
      } else {
        // Fetch payment status to get paymentId
        const statusRes = await paymentApi.getStatus(order._id);
        if (!statusRes.data.success) {
          throw new Error('Payment not found for this order');
        }
        paymentId = statusRes.data.data.paymentId;
      }

      // Process refund
      const refundRes = await paymentApi.refund({
        paymentId,
        amount: order.totalAmount
      });

      if (refundRes.data.success) {
        setRefundStatus(prev => ({ 
          ...prev, 
          [order._id]: { 
            status: 'success', 
            message: `Refund of $${order.totalAmount.toFixed(2)} processed successfully` 
          } 
        }));
        // Refresh orders to show updated status
        await fetchOrders();
        // Clear status message after 3 seconds
        setTimeout(() => {
          setRefundStatus(prev => ({ ...prev, [order._id]: { status: null, message: '' } }));
        }, 3000);
      } else {
        throw new Error(refundRes.data.message || 'Refund failed');
      }
    } catch (err: any) {
      console.error('Refund error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process refund';
      setRefundStatus(prev => ({ 
        ...prev, 
        [order._id]: { 
          status: 'error', 
          message: errorMessage 
        } 
      }));
      // Clear error message after 5 seconds
      setTimeout(() => {
        setRefundStatus(prev => ({ ...prev, [order._id]: { status: null, message: '' } }));
      }, 5000);
    } finally {
      setRefundingOrderId(null);
    }
  };

  const canRefund = (order: any) => {
    // Can refund if payment is completed and not already refunded
    const payment = paymentInfo[order._id];
    if (payment) {
      return payment.status === 'completed' && payment.status !== 'refunded';
    }
    // Fallback to paymentStatus from order
    return (order.paymentStatus === 'paid' || order.paymentStatus === 'completed') && 
           order.paymentStatus !== 'refunded';
  };

  const isRefunded = (order: any) => {
    const payment = paymentInfo[order._id];
    if (payment) {
      return payment.status === 'refunded';
    }
    // Check order payment status as fallback
    return order.paymentStatus === 'refunded';
  };

  return (
    <>
      <main className="container">
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          My Orders
        </h1>

        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Loading orders...</div>}

        {!loading && orders.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
              You don't have any orders yet.
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => router.push('/products')}
            >
              Start Shopping
            </button>
          </div>
        )}

        <div className="grid">
          {orders.map((order) => (
            <div key={order._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                    Order #{order.orderNumber}
                  </h3>
                  <p style={{ color: '#6b7280' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      background: getStatusColor(order.status) + '20',
                      color: getStatusColor(order.status),
                      fontWeight: '600',
                    }}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Items:</h4>
                {order.items.map((item: any, index: number) => (
                  <div key={index} style={{ marginBottom: '0.5rem' }}>
                    <p>
                      {item.productName} x {item.quantity} - ${item.price}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  Total: ${order.totalAmount.toFixed(2)}
                </p>
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                    Payment Status: <span style={{ 
                      fontWeight: '600',
                      color: order.paymentStatus === 'paid' ? '#10b981' : 
                             order.paymentStatus === 'failed' ? '#ef4444' : '#f59e0b'
                    }}>{order.paymentStatus || 'pending'}</span>
                  </p>
                  {paymentInfo[order._id] && (
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                      {paymentInfo[order._id].status === 'refunded' && (
                        <div style={{ 
                          padding: '0.75rem', 
                          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
                          borderRadius: '0.5rem',
                          border: '2px solid #fecaca',
                          color: '#991b1b',
                          marginTop: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>✓</span>
                            <strong style={{ fontSize: '0.9375rem' }}>
                              Refunded: ${paymentInfo[order._id].refundAmount?.toFixed(2) || order.totalAmount.toFixed(2)}
                            </strong>
                          </div>
                          {paymentInfo[order._id].refundTransactionId && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              marginTop: '0.5rem',
                              padding: '0.375rem',
                              background: 'rgba(255, 255, 255, 0.5)',
                              borderRadius: '0.25rem',
                              fontFamily: 'monospace',
                              wordBreak: 'break-all'
                            }}>
                              ID: {paymentInfo[order._id].refundTransactionId}
                            </div>
                          )}
                        </div>
                      )}
                      {paymentInfo[order._id].cardLast4 && paymentInfo[order._id].status !== 'refunded' && (
                        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span>💳</span>
                          <span>Card: •••• {paymentInfo[order._id].cardLast4}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Refund Status Messages */}
                {refundStatus[order._id]?.status && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    background: refundStatus[order._id].status === 'success' ? '#d1fae5' : '#fee2e2',
                    border: `1px solid ${refundStatus[order._id].status === 'success' ? '#a7f3d0' : '#fecaca'}`,
                    color: refundStatus[order._id].status === 'success' ? '#065f46' : '#991b1b',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    animation: 'fadeIn 0.3s ease-in'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>
                      {refundStatus[order._id].status === 'success' ? '✓' : '✕'}
                    </span>
                    <span>{refundStatus[order._id].message}</span>
                  </div>
                )}

                {canRefund(order) && !isRefunded(order) && (
                  <button
                    className="btn btn-secondary"
                    style={{ 
                      marginTop: '1rem', 
                      width: '100%', 
                      borderColor: '#ef4444', 
                      color: '#ef4444',
                      backgroundColor: refundingOrderId === order._id ? '#fee2e2' : 'transparent',
                      opacity: refundingOrderId === order._id ? 0.8 : 1,
                      cursor: refundingOrderId === order._id ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onClick={() => handleRefund(order)}
                    disabled={refundingOrderId === order._id}
                  >
                    {refundingOrderId === order._id ? (
                      <>
                        <span style={{
                          display: 'inline-block',
                          width: '16px',
                          height: '16px',
                          border: '2px solid #ef4444',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite'
                        }}></span>
                        Processing Refund...
                      </>
                    ) : (
                      <>
                        <span>↩</span>
                        Request Refund (${order.totalAmount.toFixed(2)})
                      </>
                    )}
                  </button>
                )}
                
                {isRefunded(order) && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    borderRadius: '0.5rem',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    textAlign: 'center',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>✓</span>
                    <span>Refunded: ${paymentInfo[order._id]?.refundAmount?.toFixed(2) || order.totalAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

