/* Ration Seva - login / registration form logic. Developer: Raj Gautam. */
(function () {
  'use strict';

  function pagePrefix() {
    return (window.RATION_PATHS && window.RATION_PATHS.PAGE_PREFIX) || '';
  }

  function dashboardUrl() {
    return pagePrefix() + 'dashboard.html';
  }

  function loginUrl() {
    return pagePrefix() + 'login.html';
  }

  function initLogin() {
    const form = document.getElementById('loginForm');
    const btn = document.getElementById('loginBtn');
    if (!form || !btn) return;

    if (getCurrentUser()) {
      window.location.href = dashboardUrl();
      return;
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const aadhaar = document.getElementById('aadhaar').value.trim();
      const password = document.getElementById('password').value;

      if (!/^\d{12}$/.test(aadhaar)) {
        return showAlert('alert', 'Enter a valid 12-digit Aadhaar number.', 'danger');
      }

      btn.disabled = true;
      btn.textContent = 'Logging in...';
      try {
        const data = await apiCall('/auth/login', {
          method: 'POST',
          body: { aadhaar: aadhaar, password: password }
        });
        setSession(data.token, data.user);
        window.location.href = dashboardUrl();
      } catch (err) {
        showAlert('alert', err.message, 'danger');
        btn.disabled = false;
        btn.textContent = 'Login';
      }
    });
  }

  function initRegister() {
    const form = document.getElementById('registerForm');
    const btn = document.getElementById('registerBtn');
    if (!form || !btn) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const payload = {
        name: document.getElementById('name').value.trim(),
        aadhaar: document.getElementById('aadhaar').value.trim(),
        password: document.getElementById('password').value,
        phone: document.getElementById('phone').value.trim(),
        familyMembers: parseInt(document.getElementById('familyMembers').value, 10),
        category: document.getElementById('category').value,
        role: document.getElementById('role').value,
        address: document.getElementById('address').value.trim()
      };

      if (!/^\d{12}$/.test(payload.aadhaar)) {
        return showAlert('alert', 'Aadhaar must be exactly 12 digits.', 'danger');
      }
      if (!/^\d{10}$/.test(payload.phone)) {
        return showAlert('alert', 'Phone must be exactly 10 digits.', 'danger');
      }
      if (payload.password.length < 8) {
        return showAlert('alert', 'Password must be at least 8 characters.', 'danger');
      }

      btn.disabled = true;
      btn.textContent = 'Creating account...';
      try {
        await apiCall('/auth/register', { method: 'POST', body: payload });
        showAlert('alert', 'Registered successfully. Redirecting to login...', 'success');
        setTimeout(function () {
          window.location.href = loginUrl();
        }, 1400);
      } catch (err) {
        showAlert('alert', err.message, 'danger');
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }

  function init() {
    initLogin();
    initRegister();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
