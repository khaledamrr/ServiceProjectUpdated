'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { managementApi, productApi } from '@/lib/api';

export default function SectionManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    type: 'products',
    displayStyle: 'grid',
    productIds: [] as string[],
    categoryId: '',
    limit: 8,
    order: 0,
    isActive: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
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
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [sectionsRes, productsRes] = await Promise.all([
        managementApi.getAllSections(),
        productApi.getAll(),
      ]);
      setSections(sectionsRes.data.data || []);
      setProducts(productsRes.data.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const submitData = {
        ...formData,
        limit: parseInt(formData.limit.toString()),
        order: parseInt(formData.order.toString()),
      };

      if (editingSection) {
        await managementApi.updateSection(editingSection._id, submitData);
        setSuccess('Section updated successfully!');
      } else {
        await managementApi.createSection(submitData);
        setSuccess('Section created successfully!');
      }

      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save section');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      type: 'products',
      displayStyle: 'grid',
      productIds: [],
      categoryId: '',
      limit: 8,
      order: sections.length,
      isActive: true,
    });
    setEditingSection(null);
    setShowForm(false);
  };

  const handleEdit = (section: any) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      subtitle: section.subtitle || '',
      type: section.type,
      displayStyle: section.displayStyle,
      productIds: section.productIds?.map((id: any) => id.toString()) || [],
      categoryId: section.categoryId?.toString() || '',
      limit: section.limit,
      order: section.order,
      isActive: section.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      await managementApi.deleteSection(id);
      setSuccess('Section deleted successfully!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete section');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await managementApi.updateSection(id, { isActive: !currentStatus });
      setSuccess('Section status updated!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update section');
    }
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData({ ...formData, productIds: selectedOptions });
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
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
          Section Management
        </h1>
        <button
          onClick={() => router.push('/admin')}
          className="btn"
          style={{ backgroundColor: '#6b7280', color: 'white', padding: '0.5rem 1rem' }}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => {
              if (showForm && !editingSection) {
                resetForm();
              } else {
                setShowForm(!showForm);
                setEditingSection(null);
              }
            }}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add New Section'}
          </button>
        </div>

        {showForm && (
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {editingSection ? 'Edit Section' : 'Add New Section'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subtitle (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Section Type *</label>
                <select
                  className="form-input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="products">Products</option>
                  <option value="categories">Categories</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Display Style *</label>
                <select
                  className="form-input"
                  value={formData.displayStyle}
                  onChange={(e) => setFormData({ ...formData, displayStyle: e.target.value })}
                  required
                >
                  <option value="grid">Grid</option>
                  <option value="carousel">Carousel</option>
                  <option value="list">List</option>
                </select>
              </div>

              {formData.type === 'products' && (
                <div className="form-group">
                  <label className="form-label">Select Products (Hold Ctrl/Cmd to select multiple)</label>
                  <select
                    multiple
                    className="form-input"
                    value={formData.productIds}
                    onChange={handleProductSelect}
                    style={{ minHeight: '200px' }}
                  >
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} - ${product.price}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#6b7280', marginTop: '0.5rem', display: 'block' }}>
                    Selected: {formData.productIds.length} product(s)
                  </small>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Limit (Number of items to display) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: parseInt(e.target.value) })}
                  min="1"
                  max="50"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Order *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingSection ? 'Update Section' : 'Create Section'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn"
                  style={{ backgroundColor: '#6b7280', color: 'white' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              All Sections ({sections.length})
            </h2>
          </div>

          {sections.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No sections found. Create your first section!
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {sections.map((section) => (
                <div key={section._id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', marginBottom: '1rem', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                        {section.title}
                      </h3>
                      {section.subtitle && (
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          {section.subtitle}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          <strong>Type:</strong> {section.type}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          <strong>Style:</strong> {section.displayStyle}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          <strong>Limit:</strong> {section.limit}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          <strong>Order:</strong> {section.order}
                        </span>
                        {section.type === 'products' && section.productIds && (
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            <strong>Products:</strong> {section.productIds.length}
                          </span>
                        )}
                        <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                          {section.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        onClick={() => handleEdit(section)}
                        className="btn"
                        style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(section._id, section.isActive)}
                        className="btn"
                        style={{ backgroundColor: section.isActive ? '#f59e0b' : '#10b981', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        {section.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(section._id)}
                        className="btn"
                        style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
