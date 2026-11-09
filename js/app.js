/* Ration Seva - shared client utilities. Developer: Raj Gautam. */

/* Works from the site root (index.html) and from /pages/*.html. */
const IS_IN_PAGES = window.location.pathname.indexOf('/pages/') !== -1;
const BASE = IS_IN_PAGES ? '../' : './';
const PAGE_PREFIX = IS_IN_PAGES ? '' : 'pages/';
window.RATION_PATHS = { IS_IN_PAGES, BASE, PAGE_PREFIX };

const API_BASE = (window.RATION_CONFIG && window.RATION_CONFIG.API_BASE) || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch (e) {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function logout() {
  clearSession();
  window.location.href = PAGE_PREFIX + 'login.html';
}

function requireAuth(allowedRoles = []) {
  const user = getCurrentUser();
  if (!user || !getToken()) {
    window.location.href = PAGE_PREFIX + 'login.html';
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    window.location.href = PAGE_PREFIX + 'dashboard.html';
    return null;
  }
  return user;
}

function isMockMode() {
  if (!window.MockAPI) return false;
  const forced = new URLSearchParams(window.location.search).get('mock');
  if (forced === '1') {
    try { localStorage.setItem('ration_use_mock', '1'); } catch (e) { /* ignore */ }
    return true;
  }
  if (forced === '0') {
    try { localStorage.removeItem('ration_use_mock'); } catch (e) { /* ignore */ }
    return false;
  }
  if (localStorage.getItem('ration_use_mock') === '1') return true;
  if (window.location.protocol === 'file:') return true;
  const host = window.location.hostname;
  const isLocal =
    host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '';
  return !isLocal;
}

async function apiCall(endpoint, options = {}) {
  if (isMockMode()) {
    return window.smartApiCall(endpoint, options);
  }

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
    });
  } catch (err) {
    throw new Error('Cannot reach the server. Is the backend running on port 5000?');
  }

  let data = {};
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { msg: text };
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
    }
    const msg = data.msg || (data.errors && data.errors[0] && data.errors[0].message) || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatINR(amount) {
  return '\u20B9' + Number(amount || 0).toLocaleString('en-IN');
}

function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showAlert(containerId, message, type = 'info') {
  const el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      if (el.innerHTML.includes(escapeHtml(message))) el.innerHTML = '';
    }, 6000);
  }
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function itemSummary(items) {
  if (!Array.isArray(items) || !items.length) return '-';
  return items.map((i) => `${i.quantity}${i.unit} ${i.itemName}`).join(', ');
}
