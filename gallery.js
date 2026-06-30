// ===== Gallery Data =====
const galleryData = {
    halqa: {
        title: "Weekly Halqa",
        images: [
            { src: "images/Weekly_Halqa1.jpg", caption: "Weekly Halqa" },
            { src: "images/Weekly_halqa2.jpg", caption: "Weekly Halqa" },
            { src: "images/Community_halqaquran.jpg", caption: "Quran Halqa" },
            { src: "images/Community_QuranHalqa.jpg", caption: "Quran Halqa" }
        ]
    },
    community: {
        title: "Community Gatherings",
        images: [
            { src: "images/Community_Gathering1.jpg", caption: "Community Gathering" },
            { src: "images/Community_gathering45.jpg", caption: "Community Gathering" },
            { src: "images/Commnity_event32.jpg", caption: "Community Event" },
            { src: "images/Community_event32.jpg", caption: "Community Event" },
            { src: "images/mmunity_gathering65.jpg", caption: "Community Gathering" },
            { src: "images/Community_iftar.jpg", caption: "Community Iftar" },
            { src: "images/Neighbour_week_Activity1.jpg", caption: "Neighbour Week Activity" }
        ]
    },
    eid: {
        title: "Eid Celebrations",
        images: [
            { src: "images/Eid_gathering1.jpg", caption: "Eid Gathering" },
            { src: "images/Eid_Gathering2.jpg", caption: "Eid Gathering" },
            { src: "images/Eid_Gathering25.jpg", caption: "Eid Gathering" },
            { src: "images/Eid_Gathering3.jpg", caption: "Eid Gathering" }
        ]
    },
    charity: {
        title: "Charity & Relief",
        images: [
            { src: "images/Charity_Dinner1.jpg", caption: "Charity Dinner" },
            { src: "images/Charity_Dinner2.jpg", caption: "Charity Dinner" },
            { src: "images/Flood-relief_pak.jpg", caption: "Pakistan Flood Relief" },
            { src: "images/Flood_reliefpak2.jpg", caption: "Pakistan Flood Relief" },
            { src: "images/Flood_Reliefpk3.jpg", caption: "Pakistan Flood Relief" },
            { src: "images/Flood_Reliefpk6.jpg", caption: "Pakistan Flood Relief" }
        ]
    },
    visits: {
        title: "Visits & Outreach",
        images: [
            { src: "images/ICNA-Visit1.jpg", caption: "ICNA Visit" },
            { src: "images/ICna_visit2.jpg", caption: "ICNA Visit" }
        ]
    }
};

// ===== Elements =====
const categoriesView = document.getElementById('galleryCategories');
const photosView = document.getElementById('galleryPhotosView');
const galleryGrid = document.getElementById('galleryGrid');
const categoryTitle = document.getElementById('galleryCategoryTitle');
const backBtn = document.getElementById('galleryBackBtn');
const categoryCards = document.querySelectorAll('.gallery-category-card');

let currentImages = [];
let currentGalleryIndex = 0;

// ===== Category Click =====
categoryCards.forEach(card => {
    card.addEventListener('click', () => {
        const category = card.dataset.category;
        openCategory(category);
    });
});

function openCategory(category) {
    const data = galleryData[category];
    if (!data) return;

    currentImages = data.images;
    categoryTitle.textContent = data.title;

    // Render photos grid
    galleryGrid.innerHTML = currentImages.map((img, i) => `
        <div class="gallery-item" data-index="${i}" tabindex="0" role="button">
            <img src="${img.src}" alt="${img.caption}" loading="lazy">
            <div class="gallery-overlay"><p>${img.caption}</p></div>
        </div>
    `).join('');

    // Attach click events to new items
    galleryGrid.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => openLightbox(parseInt(item.dataset.index)));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(parseInt(item.dataset.index)); }
        });
    });

    // Show photos, hide categories
    categoriesView.hidden = true;
    photosView.hidden = false;
    window.scrollTo({ top: photosView.offsetTop - 80, behavior: 'smooth' });
}

// ===== Back Button =====
backBtn.addEventListener('click', () => {
    photosView.hidden = true;
    categoriesView.hidden = false;
    window.scrollTo({ top: categoriesView.offsetTop - 80, behavior: 'smooth' });
});

// ===== Lightbox =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');

function openLightbox(index) {
    currentGalleryIndex = index;
    const img = currentImages[index];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.caption;
    lightboxCaption.textContent = img.caption;
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('visible'));
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('visible');
    setTimeout(() => { lightbox.hidden = true; document.body.style.overflow = ''; }, 300);
}

function navigateLightbox(direction) {
    currentGalleryIndex = (currentGalleryIndex + direction + currentImages.length) % currentImages.length;
    const img = currentImages[currentGalleryIndex];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.caption;
    lightboxCaption.textContent = img.caption;
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
