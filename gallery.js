// ===== Gallery Lightbox =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const galleryItems = document.querySelectorAll('.gallery-item');
let currentGalleryIndex = 0;

galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(index); }
    });
});

function openLightbox(index) {
    currentGalleryIndex = index;
    const item = galleryItems[index];
    const img = item.querySelector('img');
    const caption = item.querySelector('p')?.textContent || '';

    if (img) { lightboxImg.src = img.src; lightboxImg.alt = img.alt; }
    else { lightboxImg.src = ''; lightboxImg.alt = caption; }

    lightboxCaption.textContent = caption;
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('visible'));
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('visible');
    setTimeout(() => { lightbox.hidden = true; document.body.style.overflow = ''; }, 300);
}

document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-prev').addEventListener('click', () => { currentGalleryIndex = (currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length; openLightbox(currentGalleryIndex); });
document.querySelector('.lightbox-next').addEventListener('click', () => { currentGalleryIndex = (currentGalleryIndex + 1) % galleryItems.length; openLightbox(currentGalleryIndex); });
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', (e) => {
    if (!lightbox.hidden) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') { currentGalleryIndex = (currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length; openLightbox(currentGalleryIndex); }
        if (e.key === 'ArrowRight') { currentGalleryIndex = (currentGalleryIndex + 1) % galleryItems.length; openLightbox(currentGalleryIndex); }
    }
});
