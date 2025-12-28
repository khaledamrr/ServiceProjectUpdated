'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userApi, productApi, orderApi } from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'admin') {
      console.log(userData);
      router.push('/');
      return;
    }

    setUser(userData);
    loadStats();
  }, [router]);

  const loadStats = async () => {
    try {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        userApi.getAll(),
        productApi.getAll(),
        orderApi.getAll(),
      ]);

      setStats({
        totalUsers: usersRes.data.data?.length || 0,
        totalProducts: productsRes.data.data?.length || 0,
        totalOrders: ordersRes.data.data?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    router.push('/login');
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
          Admin Dashboard
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: '#6b7280' }}>Welcome, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="btn"
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Total Users
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.totalUsers}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Total Products
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.totalProducts}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Total Orders
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
              {stats.totalOrders}
            </p>
          </div>
        </div>

        {/* Management Sections */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {/* User Management */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
              User Management
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Manage all registered users, view details, and perform administrative actions.
            </p>
            <button
              onClick={() => router.push('/users')}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Manage Users
            </button>
          </div>

          {/* Website Management */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
              Website Management
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Manage website settings, sliders, and configurations.
            </p>
            <button
              onClick={() => router.push('/admin/management')}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Manage Website
            </button>
          </div>

          {/* Category Management */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
              Category Management
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Create and manage product categories with images.
            </p>
            <button
              onClick={() => router.push('/admin/categories')}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Manage Categories
            </button>
          </div>

          {/* Product Management */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
              Product Management
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Add, edit, or remove products from the catalog.
            </p>
            <button
              onClick={() => router.push('/admin/products')}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Manage Products
            </button>
          </div>

          {/* Order Management */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
              Order Management
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              View and manage all customer orders and their statuses.
            </p>
            <button
              onClick={() => router.push('/admin/orders')}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Manage Orders
            </button>
          </div>

          {/* Section Management */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
              Section Management
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Manage homepage sections, featured products, and content layout.
            </p>
            <button
              onClick={() => router.push('/admin/sections')}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Manage Sections
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginTop: '2rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/admin/products')}
              className="btn"
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '0.75rem 1.5rem',
              }}
            >
              + Add New Product
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn"
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '0.75rem 1.5rem',
              }}
            >
              View Site
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
