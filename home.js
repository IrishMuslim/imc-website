// ===== Jumu'ah Countdown =====
function updateJumuahCountdown() {
    const now = new Date();
    let nextFriday = new Date(now);
    const dayOfWeek = now.getDay();
    let daysUntilFriday = (5 - dayOfWeek + 7) % 7;

    if (daysUntilFriday === 0) {
        const fridayCutoff = new Date(now);
        fridayCutoff.setHours(13, 30, 0, 0);
        if (now >= fridayCutoff) daysUntilFriday = 7;
    }

    nextFriday.setDate(now.getDate() + daysUntilFriday);
    nextFriday.setHours(13, 30, 0, 0);

    const diff = nextFriday - now;
    document.getElementById('countDays').textContent = Math.floor(diff / (1000 * 60 * 60 * 24));
    document.getElementById('countHours').textContent = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    document.getElementById('countMinutes').textContent = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    document.getElementById('countSeconds').textContent = Math.floor((diff % (1000 * 60)) / 1000);
}

updateJumuahCountdown();
setInterval(updateJumuahCountdown, 1000);

// ===== Announcement Carousel =====
const slides = document.querySelectorAll('.announcement-slide');
const dots = document.querySelectorAll('.announcement-dots .dot');
let currentSlide = 0;
let isPaused = false;

function showSlide(index) {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    slides[index].classList.add('active');
    dots[index].classList.add('active');
    currentSlide = index;
}

let announcementInterval = setInterval(() => { if (!isPaused) showSlide((currentSlide + 1) % slides.length); }, 4000);

dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
        showSlide(i);
        clearInterval(announcementInterval);
        announcementInterval = setInterval(() => { if (!isPaused) showSlide((currentSlide + 1) % slides.length); }, 4000);
    });
});

const announcementBanner = document.querySelector('.announcement-banner');
announcementBanner.addEventListener('mouseenter', () => { isPaused = true; });
announcementBanner.addEventListener('mouseleave', () => { isPaused = false; });
announcementBanner.addEventListener('focusin', () => { isPaused = true; });
announcementBanner.addEventListener('focusout', () => { isPaused = false; });

// ===== Salah Timings =====
async function fetchPrayerTimes() {
    const salahGrid = document.getElementById('salahGrid');
    const salahDate = document.getElementById('salahDate');

    try {
        const lat = 53.3498, lng = -6.2603;
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

        const response = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=2`);
        const data = await response.json();

        if (data.code === 200) {
            const timings = data.data.timings;
            const hijriDate = data.data.date.hijri;
            const gregorianDate = data.data.date.readable;

            salahDate.innerHTML = `<span>${gregorianDate}</span><br><span style="font-size:0.9rem;opacity:0.8;">${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH</span>`;

            const prayers = [
                { name: 'Fajr', key: 'Fajr', icon: '🌅' },
                { name: 'Sunrise', key: 'Sunrise', icon: '☀️' },
                { name: 'Dhuhr', key: 'Dhuhr', icon: '🌞' },
                { name: 'Asr', key: 'Asr', icon: '🌤️' },
                { name: 'Maghrib', key: 'Maghrib', icon: '🌅' },
                { name: 'Isha', key: 'Isha', icon: '🌙' }
            ];

            salahGrid.innerHTML = prayers.map(p => `<div class="salah-item"><span class="salah-name">${p.icon} ${p.name}</span><span class="salah-time">${timings[p.key]}</span></div>`).join('');

            // Highlight current prayer
            const now = new Date();
            const currentMin = now.getHours() * 60 + now.getMinutes();
            let activeIdx = -1;
            for (let i = prayers.length - 1; i >= 0; i--) {
                const [h, m] = timings[prayers[i].key].split(':').map(Number);
                if (currentMin >= h * 60 + m) { activeIdx = i; break; }
            }
            if (activeIdx >= 0) salahGrid.children[activeIdx].classList.add('active');
        }
    } catch (e) {
        salahGrid.innerHTML = '<div class="salah-item"><span class="salah-name">Unable to load</span><span class="salah-time">Try again later</span></div>';
    }
}

fetchPrayerTimes();
