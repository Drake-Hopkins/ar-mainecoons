document.addEventListener("DOMContentLoaded", function () {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightbox-close');
  const lightboxImages = document.querySelectorAll('.lightbox-img');

  document.querySelectorAll('[data-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.dataset.index;
      lightboxImages.forEach(img => img.style.display = 'none');
      const selectedImg = document.querySelector(`.lightbox-img[data-lightbox-index="${idx}"]`);
      if (selectedImg) selectedImg.style.display = 'block';
      lightbox.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    });
  });

  closeBtn.addEventListener('click', () => {
    lightbox.classList.add('hidden'); 
    lightboxImages.forEach(img => img.style.display = 'none');
    document.body.style.overflow = '';
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.add('hidden');
      lightboxImages.forEach(img => img.style.display = 'none');
      document.body.style.overflow = '';
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && !lightbox.classList.contains('hidden')) {
      lightbox.classList.add('hidden');
      lightboxImages.forEach(img => img.style.display = 'none');
      document.body.style.overflow = '';
    }
  });
});

