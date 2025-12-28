'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { categoryApi, uploadApi } from '@/lib/api';

export default function AdminCategories() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null); // Track category being edited

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
    loadCategories();
  }, [router]);

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
    });
    // Don't set preview for existing image - we'll show it separately
    setSelectedFile(null);
    setImagePreview('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    try {
      let imagePath = '';

      if (selectedFile) {
        // Upload new image
        const fileList = new DataTransfer();
        fileList.items.add(selectedFile);
        const uploadResponse = await uploadApi.uploadImages(fileList.files);
        imagePath = uploadResponse.data.data.paths[0];
      } else if (editingCategory) {
        // Keep existing image if no new image selected
        imagePath = editingCategory.image || '';
      }

      const categoryData = {
        name: formData.name,
        description: formData.description,
        image: imagePath,
      };

      if (editingCategory) {
        // Update existing category
        await categoryApi.update(editingCategory._id, categoryData);
        setSuccess('Category updated successfully!');
      } else {
        // Create new category
        await categoryApi.create(categoryData);
        setSuccess('Category created successfully!');
      }

      // Reset form
      setFormData({ name: '', description: '', image: '' });
      setSelectedFile(null);
      setImagePreview('');
      setEditingCategory(null);
      setShowForm(false);
      loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${editingCategory ? 'update' : 'create'} category`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryApi.delete(id);
      setSuccess('Category deleted successfully!');
      loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
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
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
          Category Management
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
              if (showForm) {
                // Cancel - reset everything
                setShowForm(false);
                setEditingCategory(null);
                setFormData({ name: '', description: '', image: '' });
                setSelectedFile(null);
                setImagePreview('');
              } else {
                setShowForm(true);
              }
            }}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add New Category'}
          </button>
        </div>

        {showForm && (
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
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
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Image</label>

                {/* Show existing image when editing */}
                {editingCategory && editingCategory.image && !selectedFile && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      Current Image:
                    </p>
                    <img
                      src={editingCategory.image}
                      alt="Current category"
                      style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '0.5rem', border: '2px solid #e5e7eb' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', marginTop: '0.5rem' }}>
                      Upload a new image below to replace, or leave empty to keep current image.
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="form-input"
                  style={{ padding: '0.5rem' }}
                />
              </div>

              {imagePreview && (
                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '0.5rem' }}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={uploading}>
                {uploading ? (editingCategory ? 'Updating...' : 'Creating...') : (editingCategory ? 'Update Category' : 'Create Category')}
              </button>
            </form>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              All Categories ({categories.length})
            </h2>
          </div>

          {categories.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No categories found. Create your first category!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', padding: '1.5rem' }}>
              {categories.map((category) => (
                <div key={category._id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '150px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                      📁
                    </div>
                  )}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{category.name}</h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                      {category.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(category)}
                        className="btn"
                        style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', flex: 1 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="btn"
                        style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem', flex: 1 }}
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
