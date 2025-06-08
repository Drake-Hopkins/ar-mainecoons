document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  const urls = JSON.parse(gallery.dataset.urls || '[]');
  const alts = JSON.parse(gallery.dataset.alts || '[]');
  const lightbox = document.getElementById('lightbox');
  const imgEl = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');

  gallery.querySelectorAll('button[data-index]').forEach((button) => {
    const idx = Number(button.dataset.index);
    button.addEventListener('click', () => {
      if (!lightbox || !imgEl) return;
      imgEl.src = urls[idx] || '';
      imgEl.alt = alts[idx] || '';
      lightbox.classList.remove('hidden');
      lightbox.classList.add('flex');
    });
  });

  closeBtn?.addEventListener('click', () => {
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
  });

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.add('hidden');
      lightbox.classList.remove('flex');
    }
  });
});
