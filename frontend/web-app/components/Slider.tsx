'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SliderProps {
  sliders: any[];
}

export default function Slider({ sliders }: SliderProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (sliders.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliders.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sliders.length, isPaused]);

  if (!sliders || sliders.length === 0) {
    return null;
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + sliders.length) % sliders.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sliders.length);
  };

  const handleSliderClick = () => {
    const currentSlider = sliders[currentIndex];
    if (currentSlider.link) {
      router.push(currentSlider.link);
    }
  };

  return (
    <div
      className="slider-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="slider-wrapper">
        {sliders.map((slider, index) => (
          <div
            key={slider._id}
            className={`slider-slide ${index === currentIndex ? 'slider-slide-active' : ''}`}
            onClick={handleSliderClick}
            style={{ cursor: slider.link ? 'pointer' : 'default' }}
          >
            <img
              src={slider.image}
              alt={slider.title}
              className="slider-image"
            />
            <div className="slider-overlay">
              <div className="slider-content">
                <h2 className="slider-title">{slider.title}</h2>
                {slider.description && (
                  <p className="slider-description">{slider.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sliders.length > 1 && (
        <>
          <button
            className="slider-arrow slider-arrow-left"
            onClick={goToPrevious}
            aria-label="Previous slide"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            className="slider-arrow slider-arrow-right"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="slider-dots">
            {sliders.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentIndex ? 'slider-dot-active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
