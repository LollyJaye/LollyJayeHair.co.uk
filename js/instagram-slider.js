// Instagram slider — auto-advancing, swipeable, driven by js/instagram-data.js

document.addEventListener('DOMContentLoaded', initInstagramSlider);

function initInstagramSlider() {
  const track = document.getElementById('ig-track');
  if (!track) return;

  const posts = window.INSTAGRAM_POSTS || [];
  const dotsEl = document.getElementById('ig-dots');
  const prevBtn = document.querySelector('.ig-prev');
  const nextBtn = document.querySelector('.ig-next');
  const profileUrl = 'https://instagram.com/hairbylollyjaye';

  const igIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>`;

  posts.forEach(p => {
    const slide = document.createElement('a');
    slide.className = 'ig-slide';
    slide.href = p.url || profileUrl;
    slide.target = '_blank';
    slide.rel = 'noopener';
    slide.innerHTML = `
      <img src="${p.image}" alt="${p.caption || 'Instagram post'}" loading="lazy">
      <div class="ig-overlay"><span>${igIcon} ${p.caption || 'View on Instagram'}</span></div>
    `;
    track.appendChild(slide);
  });

  const slides = Array.from(track.children);
  if (slides.length === 0) return;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'ig-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => scrollToSlide(i));
    dotsEl.appendChild(dot);
  });
  const dots = Array.from(dotsEl.children);

  function currentIndex() {
    const trackLeft = track.getBoundingClientRect().left;
    let closest = 0, minDist = Infinity;
    slides.forEach((s, i) => {
      const dist = Math.abs(s.getBoundingClientRect().left - trackLeft);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    return closest;
  }

  function updateDots() {
    const idx = currentIndex();
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  function scrollToSlide(i) {
    const clamped = (i + slides.length) % slides.length;
    const target = slides[clamped];
    track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => scrollToSlide(currentIndex() - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => scrollToSlide(currentIndex() + 1));

  let scrollTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(updateDots, 100);
  });

  let autoTimer;
  function startAuto() {
    if (slides.length < 2) return;
    stopAuto();
    autoTimer = setInterval(() => scrollToSlide(currentIndex() + 1), 3500);
  }
  function stopAuto() { clearInterval(autoTimer); }

  track.addEventListener('mouseenter', stopAuto);
  track.addEventListener('mouseleave', startAuto);
  track.addEventListener('touchstart', stopAuto, { passive: true });
  track.addEventListener('touchend', () => setTimeout(startAuto, 4000), { passive: true });

  updateDots();
  startAuto();
}
