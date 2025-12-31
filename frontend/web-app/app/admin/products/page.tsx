'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productApi, uploadApi, categoryApi } from '@/lib/api';

export default function AdminProducts() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stock: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number>(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null); // Track product being edited


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
    loadProducts();
    loadCategories();
  }, [router]);

  const loadProducts = async () => {
    try {
      const response = await productApi.getAll();
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSelectedFiles(files);
    setSelectedCoverIndex(0); // Reset to first image

    // Create preview URLs
    const previews: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === files.length) {
          setImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      categoryId: product.categoryId || product.category?._id || '',
      stock: product.stock.toString(),
    });
    // Don't set image previews for existing images - we'll show them separately
    setSelectedFiles(null);
    setImagePreviews([]);
    setSelectedCoverIndex(0);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    try {
      let imagePaths: string[] = [];
      let coverImagePath = '';

      // Upload images if selected
      if (selectedFiles && selectedFiles.length > 0) {
        const uploadResponse = await uploadApi.uploadImages(selectedFiles);
        imagePaths = uploadResponse.data.data.paths;
        coverImagePath = imagePaths[selectedCoverIndex] || imagePaths[0];
      } else if (editingProduct) {
        // Keep existing images if no new images selected
        imagePaths = editingProduct.images || [];
        coverImagePath = editingProduct.coverImage || '';
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        stock: parseInt(formData.stock),
        images: imagePaths,
        coverImage: coverImagePath,
      };

      if (editingProduct) {
        // Update existing product
        await productApi.update(editingProduct._id, productData);
        setSuccess('Product updated successfully!');
      } else {
        // Create new product
        await productApi.create(productData);
        setSuccess('Product created successfully!');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        stock: '',
      });
      setSelectedFiles(null);
      setImagePreviews([]);
      setSelectedCoverIndex(0);
      setEditingProduct(null);
      setShowForm(false);
      loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${editingProduct ? 'update' : 'create'} product`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productApi.delete(id);
      setSuccess('Product deleted successfully!');
      loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
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
          Product Management
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
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
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
        {success && (
          <div style={{
            backgroundColor: '#d1fae5',
            color: '#065f46',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}>
            {success}
          </div>
        )}

        {/* Add Product Button */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => {
              if (showForm) {
                // Cancel - reset everything
                setShowForm(false);
                setEditingProduct(null);
                setFormData({
                  name: '',
                  description: '',
                  price: '',
                  categoryId: '',
                  stock: '',
                });
                setSelectedFiles(null);
                setImagePreviews([]);
              } else {
                setShowForm(true);
              }
            }}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add New Product'}
          </button>
        </div>

        {/* Add Product Form */}
        {showForm && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label className="form-label">Product Images</label>

                {/* Show existing images when editing */}
                {editingProduct && editingProduct.images && editingProduct.images.length > 0 && !selectedFiles && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      Current Images:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {editingProduct.images.map((img: string, index: number) => (
                        <div
                          key={index}
                          style={{
                            position: 'relative',
                            border: '2px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                            aspectRatio: '1',
                          }}
                        >
                          <img
                            src={img}
                            alt={`Current ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          {editingProduct.coverImage === img && (
                            <div style={{
                              position: 'absolute',
                              top: '0.25rem',
                              right: '0.25rem',
                              backgroundColor: '#4f46e5',
                              color: 'white',
                              padding: '0.125rem 0.25rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.625rem',
                              fontWeight: 'bold',
                            }}>
                              COVER
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                      Upload new images below to replace current ones, or leave empty to keep existing images.
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="form-input"
                  style={{ padding: '0.5rem' }}
                />
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Select multiple images (max 5MB each). First image will be the cover.
                </p>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <label className="form-label">Select Cover Image</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedCoverIndex(index)}
                        style={{
                          position: 'relative',
                          cursor: 'pointer',
                          border: selectedCoverIndex === index ? '3px solid #4f46e5' : '2px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          aspectRatio: '1',
                        }}
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        {selectedCoverIndex === index && (
                          <div style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                          }}>
                            COVER
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
                disabled={uploading}
              >
                {uploading ? (editingProduct ? 'Updating...' : 'Creating...') : (editingProduct ? 'Update Product' : 'Create Product')}
              </button>
            </form>
          </div>
        )}

        {/* Products List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              All Products ({products.length})
            </h2>
          </div>

          {products.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No products found. Create your first product!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Image</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Category</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Price</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Stock</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}>
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            style={{
                              width: '60px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '0.375rem',
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '0.375rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                          }}>
                            📦
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '500' }}>{product.name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{product.description}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>{typeof product.category === 'object' ? product.category?.name : product.category || 'N/A'}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{product.price} EGP</td>
                      <td style={{ padding: '1rem' }}>{product.stock}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEdit(product)}
                            className="btn"
                            style={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
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
      </main>
    </div>
  );
}
