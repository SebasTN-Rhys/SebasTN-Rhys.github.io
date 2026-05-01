/**
 * onboard-done.js
 * Handles /onboard/done — Stripe redirects here after KYC.
 * Reads ?account_id=acct_xxx from the URL, calls the Sebastn API to verify,
 * then renders the appropriate completion state.
 */

const API_BASE = 'https://api.githat.io';

function getAccessToken() {
  return localStorage.getItem('githat_access') || sessionStorage.getItem('githat_access') || null;
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHref(id, url) {
  const el = document.getElementById(id);
  if (el) el.href = url;
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const accountId = params.get('account_id');

  if (!accountId || !/^acct_[A-Za-z0-9]+$/.test(accountId)) {
    hide('loading');
    show('error-state');
    setText('error-msg', 'Missing or invalid account ID in the URL. Please try starting onboarding again.');
    return;
  }

  const token = getAccessToken();
  if (!token) {
    hide('loading');
    show('error-state');
    setText('error-msg', 'You are not signed in. Please sign in with GitHat and try again.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/sebastn/onboard/done?account_id=${encodeURIComponent(accountId)}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await res.json();
    hide('loading');

    if (!res.ok) {
      show('error-state');
      setText('error-msg', data.error || 'Could not verify your account. Please contact support.');
      return;
    }

    if (data.chargesEnabled) {
      // Fully active
      show('success-state');
      setText('success-msg', `Your account is active and ready to accept charges.`);
      setHref('dashboard-link', data.dashboardUrl);
      setText('dashboard-url-hint', `Your dashboard URL: ${data.dashboardUrl}`);
    } else if (data.detailsSubmitted) {
      // Submitted but not yet enabled — pending Stripe review
      show('pending-state');
      setHref('pending-dashboard-link', data.dashboardUrl);
    } else {
      // Details not yet submitted — send back to start
      show('error-state');
      setText('error-msg', 'It looks like the Stripe verification flow was not completed. Please try again.');
    }
  } catch (err) {
    hide('loading');
    show('error-state');
    setText('error-msg', 'Network error — please check your connection and try again.');
    console.error('[onboard-done] fetch error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
