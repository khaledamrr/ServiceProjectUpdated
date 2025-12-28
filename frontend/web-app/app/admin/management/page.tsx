'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { managementApi, uploadApi } from '@/lib/api';

export default function AdminManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sliders, setSliders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    order: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingSlider, setEditingSlider] = useState<any>(null); // Track slider being edited

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
    loadSliders();
  }, [router]);

  const loadSliders = async () => {
    try {
      const response = await managementApi.getAllSliders();
      setSliders(response.data.data || []);
    } catch (error) {
      console.error('Error loading sliders:', error);
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

  const handleEdit = (slider: any) => {
    setEditingSlider(slider);
    setFormData({
      title: slider.title,
      description: slider.description || '',
      link: slider.link || '',
      order: slider.order,
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
      } else if (editingSlider) {
        // Keep existing image if no new image selected
        imagePath = editingSlider.image || '';
      }

      const sliderData = {
        title: formData.title,
        description: formData.description,
        link: formData.link,
        image: imagePath,
        order: parseInt(formData.order.toString()),
      };

      if (editingSlider) {
        // Update existing slider
        await managementApi.updateSlider(editingSlider._id, sliderData);
        setSuccess('Slider updated successfully!');
      } else {
        // Create new slider
        await managementApi.createSlider(sliderData);
        setSuccess('Slider created successfully!');
      }

      // Reset form
      setFormData({ title: '', description: '', link: '', order: sliders.length });
      setSelectedFile(null);
      setImagePreview('');
      setEditingSlider(null);
      setShowForm(false);
      loadSliders();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${editingSlider ? 'update' : 'create'} slider`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slider?')) return;

    try {
      await managementApi.deleteSlider(id);
      setSuccess('Slider deleted successfully!');
      loadSliders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete slider');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await managementApi.updateSlider(id, { isActive: !currentStatus });
      setSuccess('Slider status updated!');
      loadSliders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update slider');
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
          Website Management
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
                setEditingSlider(null);
                setFormData({ title: '', description: '', link: '', order: sliders.length });
                setSelectedFile(null);
                setImagePreview('');
              } else {
                setShowForm(true);
              }
            }}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add New Slider'}
          </button>
        </div>

        {showForm && (
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {editingSlider ? 'Edit Slider' : 'Add New Slider'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Link (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="/products or https://example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Order</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slider Image {!editingSlider && '*'}</label>

                {/* Show existing image when editing */}
                {editingSlider && editingSlider.image && !selectedFile && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      Current Image:
                    </p>
                    <img
                      src={editingSlider.image}
                      alt="Current slider"
                      style={{ width: '100%', maxWidth: '600px', height: 'auto', borderRadius: '0.5rem', border: '2px solid #e5e7eb' }}
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
                  required={!editingSlider}
                />
              </div>

              {imagePreview && (
                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '100%', maxWidth: '600px', height: 'auto', borderRadius: '0.5rem' }}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={uploading}>
                {uploading ? (editingSlider ? 'Updating...' : 'Creating...') : (editingSlider ? 'Update Slider' : 'Create Slider')}
              </button>
            </form>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              All Sliders ({sliders.length})
            </h2>
          </div>

          {sliders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No sliders found. Create your first slider!
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {sliders.map((slider) => (
                <div key={slider._id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', marginBottom: '1rem', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: '1rem', padding: '1rem' }}>
                    {slider.image ? (
                      <img
                        src={slider.image}
                        alt={slider.title}
                        style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: '0.5rem' }}
                      />
                    ) : (
                      <div style={{ width: '200px', height: '120px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem' }}>
                        🖼️
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{slider.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        {slider.description || 'No description'}
                      </p>
                      {slider.link && (
                        <p style={{ fontSize: '0.875rem', color: '#4f46e5' }}>
                          Link: {slider.link}
                        </p>
                      )}
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        Order: {slider.order} | Status: {slider.isActive ? '✅ Active' : '❌ Inactive'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(slider)}
                        className="btn"
                        style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(slider._id, slider.isActive)}
                        className="btn"
                        style={{ backgroundColor: slider.isActive ? '#f59e0b' : '#10b981', color: 'white', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        {slider.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(slider._id)}
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
