const lightbox = document.getElementById('lightbox');
const closeBtn = document.getElementById('lightbox-close');
const lightboxImages = document.querySelectorAll('.lightbox-img');

// Attach click to all "View" buttons
document.querySelectorAll('[data-index]').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = btn.dataset.index;
    // Hide all lightbox images
    lightboxImages.forEach(img => img.style.display = 'none');
    // Show only the selected image
    const selectedImg = document.querySelector(`.lightbox-img[data-lightbox-index="${idx}"]`);
    if (selectedImg) selectedImg.style.display = 'block';
    // Show lightbox
    lightbox.classList.remove('hidden');
    // Optional: disable background scroll
    document.body.style.overflow = 'hidden';
  });
});

// Close logic
closeBtn.addEventListener('click', () => {
  lightbox.classList.add('hidden');
  lightboxImages.forEach(img => img.style.display = 'none');
  // Optional: re-enable background scroll
  document.body.style.overflow = '';
});

// Optional: close on overlay click or Escape key
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

