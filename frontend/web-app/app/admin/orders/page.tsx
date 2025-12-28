'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderApi, paymentApi } from '@/lib/api';

export default function AdminOrders() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // For viewing order details
  const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<Record<string, any>>({});
  const [refundStatus, setRefundStatus] = useState<Record<string, { status: 'success' | 'error' | null; message: string }>>({});

  useEffect(() => {
    // Check if user is admin
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'admin') {
      router.push('/');
      return;
    }

    setUser(userData);
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      const response = await orderApi.getAllAdmin();
      const ordersData = response.data.data || [];
      setOrders(ordersData);
      
      // Fetch payment info for orders
      const paymentPromises = ordersData
        .filter((order: any) => order.paymentId || order.paymentStatus === 'paid' || order.paymentStatus === 'completed')
        .map(async (order: any) => {
          try {
            const paymentStatus = await paymentApi.getStatus(order._id);
            if (paymentStatus.data.success) {
              return { orderId: order._id, payment: paymentStatus.data.data };
            }
          } catch (err) {
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
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, orderNumber: string) => {
    try {
      await orderApi.delete(id);
      loadOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete order');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      loadOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update order status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
  };

  const handleRefund = async (order: any) => {
    setRefundingOrderId(order._id);
    setRefundStatus(prev => ({ ...prev, [order._id]: { status: null, message: '' } }));
    
    try {
      let paymentId: string;
      
      if (order.paymentId) {
        paymentId = order.paymentId;
      } else {
        const statusRes = await paymentApi.getStatus(order._id);
        if (!statusRes.data.success) {
          throw new Error('Payment not found for this order');
        }
        paymentId = statusRes.data.data.paymentId;
      }

      const refundRes = await paymentApi.refund({
        paymentId,
        amount: order.totalAmount
      });

      if (refundRes.data.success) {
        setRefundStatus(prev => ({ 
          ...prev, 
          [order._id]: { 
            status: 'success', 
            message: `Refund of $${order.totalAmount.toFixed(2)} processed` 
          } 
        }));
        await loadOrders();
        setTimeout(() => {
          setRefundStatus(prev => ({ ...prev, [order._id]: { status: null, message: '' } }));
        }, 3000);
      } else {
        throw new Error(refundRes.data.message || 'Refund failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process refund';
      setRefundStatus(prev => ({ 
        ...prev, 
        [order._id]: { 
          status: 'error', 
          message: errorMessage 
        } 
      }));
      setTimeout(() => {
        setRefundStatus(prev => ({ ...prev, [order._id]: { status: null, message: '' } }));
      }, 5000);
    } finally {
      setRefundingOrderId(null);
    }
  };

  const canRefund = (order: any) => {
    const payment = paymentInfo[order._id];
    if (payment) {
      return payment.status === 'completed' && payment.status !== 'refunded';
    }
    return (order.paymentStatus === 'paid' || order.paymentStatus === 'completed') && 
           order.paymentStatus !== 'refunded';
  };

  const isRefunded = (order: any) => {
    const payment = paymentInfo[order._id];
    if (payment) {
      return payment.status === 'refunded';
    }
    return order.paymentStatus === 'refunded';
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

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
          Order Management
        </h1>
        <button
          onClick={() => router.push('/admin')}
          className="btn"
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '0.5rem 1rem',
          }}
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Messages */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {/* Orders List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              All Orders ({orders.length})
            </h2>
          </div>

          {orders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No orders found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Order #</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>User ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Items</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Total</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Payment</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '500' }}>{order.orderNumber}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', fontFamily: 'monospace' }}>
                          {order.userId?.substring(0, 8)}...
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem' }}>
                          {order.items?.length || 0} item(s)
                        </div>
                        {order.items?.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {item.productName} x{item.quantity}
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            +{order.items.length - 2} more
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>
                        ${order.totalAmount?.toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          backgroundColor: getStatusColor(order.status) + '20',
                          color: getStatusColor(order.status),
                        }}>
                          {order.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                          {order.paymentStatus || 'pending'}
                        </div>
                        {paymentInfo[order._id]?.status === 'refunded' && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#991b1b',
                            marginTop: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            background: '#fee2e2',
                            borderRadius: '0.25rem',
                            display: 'inline-block'
                          }}>
                            Refunded: ${paymentInfo[order._id].refundAmount?.toFixed(2) || order.totalAmount.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="btn"
                            style={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View Details
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: '1px solid #d1d5db',
                              fontSize: '0.875rem',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          
                          {/* Refund Status Message */}
                          {refundStatus[order._id]?.status && (
                            <div style={{
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              background: refundStatus[order._id].status === 'success' ? '#d1fae5' : '#fee2e2',
                              border: `1px solid ${refundStatus[order._id].status === 'success' ? '#a7f3d0' : '#fecaca'}`,
                              color: refundStatus[order._id].status === 'success' ? '#065f46' : '#991b1b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              animation: 'fadeIn 0.3s ease-in'
                            }}>
                              <span>{refundStatus[order._id].status === 'success' ? '✓' : '✕'}</span>
                              <span style={{ fontSize: '0.7rem' }}>{refundStatus[order._id].message}</span>
                            </div>
                          )}

                          {canRefund(order) && !isRefunded(order) && (
                            <button
                              onClick={() => handleRefund(order)}
                              className="btn"
                              style={{
                                backgroundColor: refundingOrderId === order._id ? '#fbbf24' : '#f59e0b',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                fontSize: '0.875rem',
                                opacity: refundingOrderId === order._id ? 0.8 : 1,
                                cursor: refundingOrderId === order._id ? 'wait' : 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                              }}
                              disabled={refundingOrderId === order._id}
                            >
                              {refundingOrderId === order._id ? (
                                <>
                                  <span style={{
                                    display: 'inline-block',
                                    width: '12px',
                                    height: '12px',
                                    border: '2px solid white',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 0.6s linear infinite'
                                  }}></span>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <span>↩</span>
                                  Refund (${order.totalAmount.toFixed(2)})
                                </>
                              )}
                            </button>
                          )}
                          {isRefunded(order) && (
                            <div style={{
                              padding: '0.5rem',
                              fontSize: '0.75rem',
                              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                              color: '#991b1b',
                              borderRadius: '0.375rem',
                              textAlign: 'center',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                              border: '1px solid #fecaca'
                            }}>
                              <span>✓</span>
                              <span>Refunded</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleDelete(order._id, order.orderNumber)}
                            className="btn"
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setSelectedOrder(null)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '2rem',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    fontSize: '1.5rem',
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>

              {/* Order Info */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Order Number</p>
                    <p style={{ fontWeight: 'bold' }}>{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Status</p>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      backgroundColor: getStatusColor(selectedOrder.status) + '20',
                      color: getStatusColor(selectedOrder.status),
                    }}>
                      {selectedOrder.status?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Order Date</p>
                    <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Payment Status</p>
                    <p style={{ textTransform: 'capitalize', fontWeight: '500' }}>{selectedOrder.paymentStatus || 'pending'}</p>
                    {paymentInfo[selectedOrder._id]?.status === 'refunded' && (
                      <div style={{ 
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: '#fee2e2',
                        borderRadius: '0.375rem',
                        color: '#991b1b',
                        fontSize: '0.875rem'
                      }}>
                        <strong>Refunded:</strong> ${paymentInfo[selectedOrder._id].refundAmount?.toFixed(2) || selectedOrder.totalAmount.toFixed(2)}
                        {paymentInfo[selectedOrder._id].refundTransactionId && (
                          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            Transaction: {paymentInfo[selectedOrder._id].refundTransactionId}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Order Items</h3>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        padding: '1rem',
                        borderBottom: index < selectedOrder.items.length - 1 ? '1px solid #e5e7eb' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: '500' }}>{item.productName}</p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          ${item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p style={{ fontWeight: 'bold' }}>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', textAlign: 'right', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    Total: ${selectedOrder.totalAmount?.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Shipping Address</h3>
                  <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                    {selectedOrder.shippingAddress.phone && (
                      <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>
                        📞 {selectedOrder.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Refund Status in Modal */}
              {selectedOrder && refundStatus[selectedOrder._id]?.status && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: refundStatus[selectedOrder._id].status === 'success' ? '#d1fae5' : '#fee2e2',
                  border: `1px solid ${refundStatus[selectedOrder._id].status === 'success' ? '#a7f3d0' : '#fecaca'}`,
                  color: refundStatus[selectedOrder._id].status === 'success' ? '#065f46' : '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  animation: 'fadeIn 0.3s ease-in'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>
                    {refundStatus[selectedOrder._id].status === 'success' ? '✓' : '✕'}
                  </span>
                  <span>{refundStatus[selectedOrder._id].message}</span>
                </div>
              )}

              {/* Refund Button */}
              {selectedOrder && canRefund(selectedOrder) && !isRefunded(selectedOrder) && (
                <button
                  onClick={async () => {
                    await handleRefund(selectedOrder);
                    // Don't close modal automatically, let user see the result
                  }}
                  className="btn"
                  style={{
                    width: '100%',
                    marginBottom: '1rem',
                    backgroundColor: refundingOrderId === selectedOrder._id ? '#fbbf24' : '#f59e0b',
                    color: 'white',
                    opacity: refundingOrderId === selectedOrder._id ? 0.8 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  disabled={refundingOrderId === selectedOrder._id}
                >
                  {refundingOrderId === selectedOrder._id ? (
                    <>
                      <span style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite'
                      }}></span>
                      Processing Refund...
                    </>
                  ) : (
                    <>
                      <span>↩</span>
                      Process Refund (${selectedOrder.totalAmount.toFixed(2)})
                    </>
                  )}
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
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
    </div>
  );
}
