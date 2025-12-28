'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { categoryApi, productApi } from '@/lib/api';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { toast, showToast, hideToast } = useToast();

  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      loadCategoryData();
    }
  }, [slug]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      const categoryRes = await categoryApi.getBySlug(slug);
      const categoryData = categoryRes.data.data;
      setCategory(categoryData);

      // Fetch all products and filter by category
      const productsRes = await productApi.getAll();
      const allProducts = productsRes.data.data || [];
      const filteredProducts = allProducts.filter(
        (p: any) => p.category?._id === categoryData._id || p.category === categoryData._id
      );
      setProducts(filteredProducts);
    } catch (err: any) {
      console.error('Error loading category:', err);
      setError('Category not found');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item._id === product._id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    showToast({ message: 'Product added to cart!', type: 'success' });
  };

  if (loading) {
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ color: '#6b7280' }}>Loading category...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !category) {
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
              Category Not Found
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              The category you're looking for doesn't exist.
            </p>
            <Link href="/categories" className="btn btn-primary">
              Browse All Categories
            </Link>
          </div>
        </div>
      </>
    );
  }

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
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {/* Category Header */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
        }}>
          {/* Category Banner */}
          {category.image && (
            <div style={{
              position: 'relative',
              height: '300px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}>
              <img
                src={category.image}
                alt={category.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.3,
                }}
              />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'white',
                textAlign: 'center',
                padding: '2rem',
              }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                  {category.name}
                </h1>
                {category.description && (
                  <p style={{ fontSize: '1.25rem', maxWidth: '600px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Breadcrumb & Info */}
          <div style={{ padding: '1.5rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
            <nav style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              <Link href="/" style={{ color: '#4f46e5', textDecoration: 'none' }}>Home</Link>
              <span style={{ margin: '0 0.5rem' }}>/</span>
              <Link href="/categories" style={{ color: '#4f46e5', textDecoration: 'none' }}>Categories</Link>
              <span style={{ margin: '0 0.5rem' }}>/</span>
              <span>{category.name}</span>
            </nav>

            {!category.image && (
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                  {category.name}
                </h1>
                {category.description && (
                  <p style={{ color: '#6b7280' }}>{category.description}</p>
                )}
              </div>
            )}

            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
              {products.length} {products.length === 1 ? 'product' : 'products'} found
            </p>
          </div>
        </header>

        {/* Products Grid */}
        <main style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
          {products.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '4rem 2rem',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>
                No Products Yet
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                This category doesn't have any products at the moment.
              </p>
              <Link href="/categories" className="btn btn-primary">
                Browse Other Categories
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '2rem',
            }}>
              {products.map((product) => (
                <div
                  key={product._id}
                  className="product-card"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Product Image */}
                  <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '4rem',
                      }}>
                        📦
                      </div>
                    )}
                    {product.stock <= 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}>
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      color: '#111827',
                      lineHeight: '1.4',
                    }}>
                      {product.name}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '1rem',
                      flex: 1,
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {product.description}
                    </p>

                    <div style={{ marginTop: 'auto' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                      }}>
                        <span style={{
                        fontSize: '1.5rem',
                          fontWeight: 'bold',
                          color: '#4f46e5',
                        }}>
                          ${product.price.toFixed(2)}
                        </span>
                        {product.stock > 0 && product.stock <= 10 && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#f59e0b',
                            fontWeight: '600',
                          }}>
                            Only {product.stock} left
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          opacity: product.stock <= 0 ? 0.5 : 1,
                          cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
    </>
  );
}
