// ===== Contact Form =====
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
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
            showSuccess(name);
        } else {
            throw new Error('Failed');
        }
    } catch (error) {
        // Reset button on error
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;

        // Show error message
        const errorMsg = document.createElement('p');
        errorMsg.style.cssText = 'color: #d32f2f; text-align: center; margin-top: 15px; font-size: 0.9rem;';
        errorMsg.textContent = 'Something went wrong. Please try again or email us directly.';
        contactForm.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 5000);
    }
});

function showSuccess(name) {
    contactForm.innerHTML = `
        <div style="text-align:center; padding:40px 20px;">
            <i class="fas fa-check-circle" style="font-size:3rem; color:var(--primary-green); margin-bottom:15px; display:block;"></i>
            <h3 style="color:var(--primary-green-dark); margin-bottom:10px;">JazakAllah Khair, ${name}!</h3>
            <p style="color:var(--text-light);">Your message has been received. We'll get back to you soon, insha'Allah.</p>
        </div>
    `;
}
