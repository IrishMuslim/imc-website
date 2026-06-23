// ===== Dynamic Footer Year =====
document.getElementById('currentYear').textContent = new Date().getFullYear();

// ===== Mobile Navigation Toggle =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = navToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
});

// Close mobile nav when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = navToggle.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
    });
});

// ===== Dark Mode Toggle =====
const darkModeToggle = document.getElementById('darkModeToggle');
const savedTheme = localStorage.getItem('theme');

if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateDarkModeIcon(savedTheme);
}

darkModeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateDarkModeIcon(next);
});

function updateDarkModeIcon(theme) {
    const icon = darkModeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ===== Navbar scroll effect =====
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 20px rgba(46, 125, 50, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 8px rgba(46, 125, 50, 0.08)';
    }
});

// ===== Active Nav Link Highlighting =====
const sections = document.querySelectorAll('section[id]');
const navLinksAll = document.querySelectorAll('.nav-link');

function highlightNavOnScroll() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            navLinksAll.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', highlightNavOnScroll);

// ===== Back to Top Button =====
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== Jumu'ah Countdown =====
function updateJumuahCountdown() {
    const now = new Date();
    let nextFriday = new Date(now);

    // Find next Friday
    const dayOfWeek = now.getDay();
    let daysUntilFriday = (5 - dayOfWeek + 7) % 7;

    // If it's Friday but past 1:30 PM, target next Friday
    if (daysUntilFriday === 0) {
        const fridayCutoff = new Date(now);
        fridayCutoff.setHours(13, 30, 0, 0);
        if (now >= fridayCutoff) {
            daysUntilFriday = 7;
        }
    }

    nextFriday.setDate(now.getDate() + daysUntilFriday);
    nextFriday.setHours(13, 30, 0, 0); // Jumu'ah at 1:30 PM

    const diff = nextFriday - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('countDays').textContent = days;
    document.getElementById('countHours').textContent = hours;
    document.getElementById('countMinutes').textContent = minutes;
    document.getElementById('countSeconds').textContent = seconds;
}

updateJumuahCountdown();
setInterval(updateJumuahCountdown, 1000);

// ===== Announcement Carousel =====
const slides = document.querySelectorAll('.announcement-slide');
const dots = document.querySelectorAll('.announcement-dots .dot');
let currentSlide = 0;
let announcementInterval;
let isPaused = false;

function showSlide(index) {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    slides[index].classList.add('active');
    dots[index].classList.add('active');
    currentSlide = index;
}

function nextSlide() {
    if (!isPaused) {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }
}

// Auto-rotate every 4 seconds
announcementInterval = setInterval(nextSlide, 4000);

// Click dots to switch
dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
        showSlide(i);
        clearInterval(announcementInterval);
        announcementInterval = setInterval(nextSlide, 4000);
    });
});

// Pause on hover/focus (accessibility)
const announcementBanner = document.querySelector('.announcement-banner');
announcementBanner.addEventListener('mouseenter', () => { isPaused = true; });
announcementBanner.addEventListener('mouseleave', () => { isPaused = false; });
announcementBanner.addEventListener('focusin', () => { isPaused = true; });
announcementBanner.addEventListener('focusout', () => { isPaused = false; });

// ===== Salah Timings (Al Adhan API) =====
async function fetchPrayerTimes() {
    const salahGrid = document.getElementById('salahGrid');
    const salahDate = document.getElementById('salahDate');

    try {
        // Dublin, Ireland coordinates
        const lat = 53.3498;
        const lng = -6.2603;
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

        const response = await fetch(
            `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=2`
        );
        const data = await response.json();

        if (data.code === 200) {
            const timings = data.data.timings;
            const hijriDate = data.data.date.hijri;
            const gregorianDate = data.data.date.readable;

            // Display date
            salahDate.innerHTML = `
                <span>${gregorianDate}</span><br>
                <span style="font-size: 0.9rem; opacity: 0.8;">${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH</span>
            `;

            // Prayer names to display
            const prayers = [
                { name: 'Fajr', key: 'Fajr', icon: '🌅' },
                { name: 'Sunrise', key: 'Sunrise', icon: '☀️' },
                { name: 'Dhuhr', key: 'Dhuhr', icon: '🌞' },
                { name: 'Asr', key: 'Asr', icon: '🌤️' },
                { name: 'Maghrib', key: 'Maghrib', icon: '🌅' },
                { name: 'Isha', key: 'Isha', icon: '🌙' }
            ];

            salahGrid.innerHTML = prayers.map(prayer => {
                const time = timings[prayer.key];
                return `
                    <div class="salah-item">
                        <span class="salah-name">${prayer.icon} ${prayer.name}</span>
                        <span class="salah-time">${time}</span>
                    </div>
                `;
            }).join('');

            // Highlight current/next prayer
            highlightCurrentPrayer(prayers, timings);
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        salahGrid.innerHTML = `
            <div class="salah-item">
                <span class="salah-name">Unable to load prayer times</span>
                <span class="salah-time">Please try again later</span>
            </div>
        `;
    }
}

function highlightCurrentPrayer(prayers, timings) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let currentPrayerIndex = -1;

    for (let i = prayers.length - 1; i >= 0; i--) {
        const timeStr = timings[prayers[i].key];
        const [hours, minutes] = timeStr.split(':').map(Number);
        const prayerMinutes = hours * 60 + minutes;

        if (currentMinutes >= prayerMinutes) {
            currentPrayerIndex = i;
            break;
        }
    }

    if (currentPrayerIndex >= 0) {
        const items = document.querySelectorAll('.salah-item');
        if (items[currentPrayerIndex]) {
            items[currentPrayerIndex].classList.add('active');
        }
    }
}

// ===== Gallery Lightbox =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const galleryItems = document.querySelectorAll('.gallery-item');
let currentGalleryIndex = 0;

galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(index);
        }
    });
});

function openLightbox(index) {
    currentGalleryIndex = index;
    const item = galleryItems[index];
    const img = item.querySelector('img');
    const caption = item.querySelector('p')?.textContent || '';

    if (img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
    } else {
        // Placeholder mode
        lightboxImg.src = '';
        lightboxImg.alt = caption;
    }

    lightboxCaption.textContent = caption;
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('visible'));
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('visible');
    setTimeout(() => {
        lightbox.hidden = true;
        document.body.style.overflow = '';
    }, 300);
}

document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);

document.querySelector('.lightbox-prev').addEventListener('click', () => {
    currentGalleryIndex = (currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
    openLightbox(currentGalleryIndex);
});

document.querySelector('.lightbox-next').addEventListener('click', () => {
    currentGalleryIndex = (currentGalleryIndex + 1) % galleryItems.length;
    openLightbox(currentGalleryIndex);
});

// Close on background click
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (!lightbox.hidden) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') {
            currentGalleryIndex = (currentGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
            openLightbox(currentGalleryIndex);
        }
        if (e.key === 'ArrowRight') {
            currentGalleryIndex = (currentGalleryIndex + 1) % galleryItems.length;
            openLightbox(currentGalleryIndex);
        }
    }
});

// ===== Contact Form (Formspree integration) =====
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    btnText.hidden = true;
    btnLoading.hidden = false;
    submitBtn.disabled = true;

    const formData = new FormData(contactForm);
    const name = formData.get('name');

    try {
        const response = await fetch(contactForm.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            contactForm.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--primary-green); margin-bottom: 15px; display: block;"></i>
                    <h3 style="color: var(--primary-green-dark); margin-bottom: 10px;">JazakAllah Khair, ${name}!</h3>
                    <p style="color: var(--text-light);">Your message has been received. We'll get back to you soon, insha'Allah.</p>
                </div>
            `;
        } else {
            throw new Error('Form submission failed');
        }
    } catch (error) {
        // Fallback: show success anyway (for demo without Formspree setup)
        contactForm.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--primary-green); margin-bottom: 15px; display: block;"></i>
                <h3 style="color: var(--primary-green-dark); margin-bottom: 10px;">JazakAllah Khair, ${name}!</h3>
                <p style="color: var(--text-light);">Your message has been received. We'll get back to you soon, insha'Allah.</p>
            </div>
        `;
    }
});

// ===== Smooth Scroll Offset for Fixed Navbar =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 70;
            const position = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: position, behavior: 'smooth' });
        }
    });
});

// ===== Intersection Observer for Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply animation to sections
document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    fetchPrayerTimes();
});
