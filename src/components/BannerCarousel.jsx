import { useEffect, useState } from 'react';
import banners from '../data/banners.json';

export default function BannerCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActive(current => (current + 1) % banners.length);
    }, 5200);
    return () => clearInterval(timer);
  }, []);

  if (!banners.length) return null;

  function goTo(index) {
    setActive((index + banners.length) % banners.length);
  }

  return (
    <section className="banner-carousel" aria-label="Destaques Projem">
      <div className="banner-stage">
        {banners.map((banner, index) => (
          <a
            key={banner.image}
            className={`banner-slide ${index === active ? 'is-active' : ''}`}
            href="#materiais"
            aria-label={banner.title || `Banner ${index + 1}`}
          >
            <img src={`/${banner.image}`} alt={banner.title || 'Banner Projem'} />
            <div className="banner-copy">
              <span>{banner.badge}</span>
              <strong>{banner.title}</strong>
              <small>{banner.subtitle}</small>
            </div>
          </a>
        ))}
      </div>

      <div className="banner-controls">
        <button type="button" onClick={() => goTo(active - 1)} aria-label="Banner anterior">‹</button>
        <div className="banner-dots">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              className={index === active ? 'is-active' : ''}
              onClick={() => goTo(index)}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => goTo(active + 1)} aria-label="Próximo banner">›</button>
      </div>
    </section>
  );
}
