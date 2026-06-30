// ===== Gallery Category Filters =====
const filterBtns = document.querySelectorAll('.gallery-filters .filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        galleryItems.forEach(item => {
            if (filter === 'all' || item.dataset.category === filter) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// ===== Gallery Lightbox =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
let currentGalleryIndex = 0;

function getVisibleItems() {
    return [...galleryItems].filter(item => item.style.display !== 'none');
}

galleryItems.forEach((item) => {
    item.addEventListener('click', () => openLightbox(item));
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(item); }
    });
});

function openLightbox(item) {
    const visible = getVisibleItems();
    currentGalleryIndex = visible.indexOf(item);

    const img = item.querySelector('img');
    const caption = item.querySelector('.gallery-overlay p')?.textContent || '';

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = caption;

    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('visible'));
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('visible');
    setTimeout(() => { lightbox.hidden = true; document.body.style.overflow = ''; }, 300);
}

function navigateLightbox(direction) {
    const visible = getVisibleItems();
    currentGalleryIndex = (currentGalleryIndex + direction + visible.length) % visible.length;
    const item = visible[currentGalleryIndex];
    const img = item.querySelector('img');
    const caption = item.querySelector('.gallery-overlay p')?.textContent || '';
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = caption;
}

document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-prev').addEventListener('click', () => navigateLightbox(-1));
document.querySelector('.lightbox-next').addEventListener('click', () => navigateLightbox(1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', (e) => {
    if (!lightbox.hidden) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    }
});
