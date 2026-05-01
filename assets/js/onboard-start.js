/**
 * onboard-start.js
 * Handles /onboard/start — merchant info form → POST to Sebastn API →
 * redirect to Stripe-hosted onboarding.
 *
 * Auth: reads GitHat access token from localStorage (key: 'githat_access').
 * If absent, shows the auth-gate prompt instead of the form.
 */

const API_BASE = 'https://api.githat.io';

function getAccessToken() {
  return localStorage.getItem('githat_access') || sessionStorage.getItem('githat_access') || null;
}

function showError(msg) {
  const banner = document.getElementById('error-banner');
  const msgEl = document.getElementById('error-message');
  if (banner && msgEl) {
    msgEl.textContent = msg;
    banner.style.display = 'block';
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function hideError() {
  const banner = document.getElementById('error-banner');
  if (banner) banner.style.display = 'none';
}

function setLoading(on) {
  const form = document.getElementById('onboard-form');
  const loading = document.getElementById('loading');
  if (form) form.style.display = on ? 'none' : 'block';
  if (loading) loading.style.display = on ? 'block' : 'none';
}

function init() {
  const token = getAccessToken();
  const authGate = document.getElementById('auth-gate');
  const form = document.getElementById('onboard-form');

  if (!token) {
    // Not signed in — show auth gate
    if (authGate) authGate.style.display = 'block';
    return;
  }

  // Signed in — show the form
  if (form) form.style.display = 'block';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const businessName = document.getElementById('businessName')?.value?.trim();
    const country = document.getElementById('country')?.value;
    const email = document.getElementById('email')?.value?.trim();
    const description = document.getElementById('description')?.value?.trim();

    if (!businessName || !country || !email || !description) {
      showError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/sebastn/onboard/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ businessName, country, email, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        showError(data.error || 'An unexpected error occurred. Please try again.');
        return;
      }

      // Redirect to Stripe-hosted onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else {
        setLoading(false);
        showError('No onboarding URL returned. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      showError('Network error — please check your connection and try again.');
      console.error('[onboard-start] fetch error:', err);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
