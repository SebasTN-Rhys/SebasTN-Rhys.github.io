/**
 * merchant-dashboard.js
 * Handles /m/{accountId} — read-only merchant dashboard.
 *
 * Reads accountId from the URL path: /m/acct_xxx
 * Auth: GitHat Bearer token from localStorage.
 * Data: fetched live from Sebastn API (no caching, v0.1).
 */

const API_BASE = 'https://api.githat.io';

function getAccessToken() {
  return localStorage.getItem('githat_access') || sessionStorage.getItem('githat_access') || null;
}

function getAccountIdFromPath() {
  // Path: /m/acct_xxx or /m/acct_xxx/
  const parts = window.location.pathname.replace(/\/$/, '').split('/');
  const idx = parts.findIndex((p) => p === 'm');
  if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  return null;
}

function show(id) { const el = document.getElementById(id); if (el) el.style.display = 'block'; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

function formatAmount(amount, currency) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function statusBadgeClass(status) {
  const map = {
    active: 'status-active',
    onboarding: 'status-onboarding',
    restricted: 'status-restricted',
    disabled: 'status-disabled',
    deauthorized: 'status-deauthorized',
  };
  return map[status] || 'status-restricted';
}

function renderPayouts(payouts) {
  const tbody = document.getElementById('payouts-body');
  const noMsg = document.getElementById('no-payouts');
  if (!payouts || payouts.length === 0) {
    hide('payouts-table-wrap');
    if (noMsg) noMsg.style.display = 'block';
    return;
  }
  if (noMsg) noMsg.style.display = 'none';
  tbody.innerHTML = payouts.map((p) => `
    <tr>
      <td>${formatAmount(p.amount, p.currency)}</td>
      <td><span class="status-badge ${p.status === 'paid' ? 'status-active' : 'status-restricted'}">${p.status}</span></td>
      <td>${formatDate(p.arrivalDate)}</td>
      <td>${p.description || '—'}</td>
      <td style="color:${p.failureMessage ? '#f87171' : 'inherit'}">${p.failureMessage || '—'}</td>
    </tr>
  `).join('');
}

function renderCharges(charges) {
  const tbody = document.getElementById('charges-body');
  const noMsg = document.getElementById('no-charges');
  if (!charges || charges.length === 0) {
    hide('charges-table');
    if (noMsg) noMsg.style.display = 'block';
    return;
  }
  if (noMsg) noMsg.style.display = 'none';
  tbody.innerHTML = charges.map((c) => `
    <tr>
      <td>${formatAmount(c.amount, c.currency)}</td>
      <td><span class="status-badge ${c.status === 'succeeded' ? 'status-active' : 'status-restricted'}">${c.status}</span></td>
      <td>${formatDate(c.createdAt)}</td>
      <td>${c.description || '—'}</td>
    </tr>
  `).join('');
}

async function init() {
  const accountId = getAccountIdFromPath();
  const token = getAccessToken();

  if (!token) {
    hide('loading');
    const link = document.getElementById('auth-gate-link');
    if (link) {
      link.href = `https://githat.io/auth/signin?redirect=${encodeURIComponent(window.location.href)}`;
    }
    show('auth-gate');
    const signinLink = document.getElementById('signin-link');
    if (signinLink) {
      signinLink.href = `https://githat.io/auth/signin?redirect=${encodeURIComponent(window.location.href)}`;
    }
    return;
  }

  // Signed in — hide sign-in link, show sign-out
  const signinLink = document.getElementById('signin-link');
  const signoutLink = document.getElementById('signout-link');
  if (signinLink) signinLink.style.display = 'none';
  if (signoutLink) {
    signoutLink.style.display = 'inline-flex';
    signoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('githat_access');
      sessionStorage.removeItem('githat_access');
      window.location.href = '/';
    });
  }

  if (!accountId || !/^acct_[A-Za-z0-9]+$/.test(accountId)) {
    hide('loading');
    show('error-state');
    setText('error-msg', 'Invalid or missing account ID in the URL. Expected: /m/acct_xxx');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/sebastn/merchants/${encodeURIComponent(accountId)}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await res.json();
    hide('loading');

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        show('auth-gate');
        return;
      }
      show('error-state');
      setText('error-msg', data.error || 'Could not load dashboard data. Please try again.');
      return;
    }

    // Populate dashboard
    const { account, payouts, charges } = data;

    setText('biz-name', account.businessName || 'Merchant Dashboard');
    setText('account-id-label', account.id);
    setText('charges-enabled', account.chargesEnabled ? 'Yes' : 'No');
    setText('payouts-enabled', account.payoutsEnabled ? 'Yes' : 'No');
    setText('account-country', account.country || '—');
    setText('account-currency', (account.defaultCurrency || '').toUpperCase() || '—');

    const badge = document.getElementById('status-badge');
    if (badge) {
      badge.textContent = account.status;
      badge.className = `status-badge ${statusBadgeClass(account.status)}`;
    }

    renderPayouts(payouts);
    renderCharges(charges);

    show('dashboard');
  } catch (err) {
    hide('loading');
    show('error-state');
    setText('error-msg', 'Network error — please check your connection and try again.');
    console.error('[merchant-dashboard] fetch error:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
