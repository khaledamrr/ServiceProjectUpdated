'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { managementApi, categoryApi } from '@/lib/api';
import Slider from '@/components/Slider';
import CategoryCard from '@/components/CategoryCard';
import ProductSection from '@/components/ProductSection';

export default function Home() {
  const router = useRouter();
  const [sliders, setSliders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [slidersRes, categoriesRes, sectionsRes] = await Promise.all([
        managementApi.getActiveSliders(),
        categoryApi.getAll(),
        managementApi.getActiveSections(),
      ]);

      setSliders(slidersRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
      setSections(sectionsRes.data.data || []);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading amazing products...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Slider */}
      {sliders.length > 0 && (
        <div className="home-slider-wrapper">
          <Slider sliders={sliders} />
        </div>
      )}

      {/* Main Content */}
      <main className="home-content">
        {/* Categories Showcase */}
        {categories.length > 0 && (
          <section className="categories-section">
            <div className="section-header-center">
              <h2 className="section-title-large">Shop by Category</h2>
              <p className="section-subtitle-large">Explore our wide range of products</p>
            </div>
            <div className="categories-grid">
              {categories.slice(0, 6).map((category) => (
                <CategoryCard key={category._id} category={category} />
              ))}
            </div>
            {categories.length > 6 && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  onClick={() => router.push('/categories')}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                >
                  View All Categories →
                </button>
              </div>
            )}
          </section>
        )}

        {/* Dynamic Product Sections */}
        {sections.map((section) => (
          <ProductSection key={section._id} section={section} />
        ))}

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">Join Our Newsletter</h2>
            <p className="cta-subtitle">Get exclusive offers and updates delivered to your inbox</p>
            <div className="cta-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="cta-input"
              />
              <button className="cta-button">Subscribe</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
